use std::sync::Mutex;

use argon2::{password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString}, Argon2};
use rand_core::OsRng;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use tauri::{AppHandle, Manager, State};

const MAX_LOGIN_FAILURES: i64 = 5;
const LOCK_SECONDS: u64 = 15 * 60;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SafeUser { id: String, display_name: String, username: String, role: String }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AuthStatus { requires_setup: bool, authenticated: bool, user: Option<SafeUser> }
struct AuthState(Mutex<Option<SafeUser>>);

fn epoch() -> u64 { std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs() }
fn now() -> String { epoch().to_string() }
fn normalize_username(value: &str) -> String { value.trim().to_lowercase() }
fn valid_username(value: &str) -> bool { let n = value.len(); n >= 3 && n <= 50 && value.bytes().all(|c| c.is_ascii_alphanumeric() || matches!(c, b'.' | b'_' | b'-')) }
fn valid_password(value: &str) -> bool { (10..=200).contains(&value.chars().count()) }
fn open_db(app: &AppHandle) -> Result<Connection, String> {
  let dir = app.path().app_data_dir().map_err(|_| "AUTH_UNAVAILABLE")?;
  std::fs::create_dir_all(&dir).map_err(|_| "AUTH_UNAVAILABLE")?;
  Connection::open(dir.join("clinic-desk.db")).map_err(|_| "AUTH_UNAVAILABLE".to_owned())
}
fn required(db: &Connection) -> Result<bool, String> { db.query_row("SELECT NOT EXISTS(SELECT 1 FROM staff_users WHERE is_active = 1 AND length(trim(password_hash)) > 0)", [], |r| r.get(0)).map_err(|_| "AUTH_UNAVAILABLE".into()) }
fn audit(db: &Connection, actor: Option<&str>, action: &str, entity: &str) -> Result<(), String> {
  db.execute("INSERT INTO audit_log (id, actor_staff_user_id, action, entity_type, entity_id, details_json, created_at) VALUES (lower(hex(randomblob(16))), ?1, ?2, 'staff_user', ?3, NULL, ?4)", params![actor, action, entity, now()]).map_err(|_| "AUTH_UNAVAILABLE")?; Ok(())
}
fn lookup_active(db: &Connection, id: &str) -> Result<Option<SafeUser>, String> {
  db.query_row("SELECT id, display_name, username, role FROM staff_users WHERE id=?1 AND is_active=1 AND length(trim(password_hash))>0", [id], |r| Ok(SafeUser { id:r.get(0)?, display_name:r.get(1)?, username:r.get(2)?, role:r.get(3)? })).optional().map_err(|_| "AUTH_UNAVAILABLE".into())
}

#[tauri::command]
fn auth_status(app: AppHandle, state: State<AuthState>) -> Result<AuthStatus, String> {
  let db = open_db(&app)?; let requires_setup = required(&db)?;
  let in_memory = state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?.clone();
  let user = match in_memory { Some(u) => lookup_active(&db, &u.id)?, None => None };
  Ok(AuthStatus { requires_setup, authenticated: user.is_some(), user })
}
#[tauri::command]
fn current_user(app: AppHandle, state: State<AuthState>) -> Result<Option<SafeUser>, String> {
  let db = open_db(&app)?; let current = state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?.clone();
  match current { Some(u) => lookup_active(&db, &u.id), None => Ok(None) }
}
#[tauri::command]
fn bootstrap_first_admin(app: AppHandle, state: State<AuthState>, display_name: String, username: String, password: String) -> Result<SafeUser, String> {
  let name = display_name.trim().to_owned(); let username = normalize_username(&username);
  if name.is_empty() { return Err("AUTH_DISPLAY_NAME_REQUIRED".into()); }
  if !valid_username(&username) { return Err("AUTH_USERNAME_INVALID".into()); }
  if !valid_password(&password) { return Err("AUTH_PASSWORD_WEAK".into()); }
  let mut db = open_db(&app)?; let tx = db.transaction().map_err(|_| "AUTH_UNAVAILABLE")?;
  let exists: i64 = tx.query_row("SELECT count(*) FROM staff_users WHERE is_active=1 AND length(trim(password_hash))>0", [], |r| r.get(0)).map_err(|_| "AUTH_UNAVAILABLE")?;
  if exists > 0 { return Err("AUTH_SETUP_COMPLETE".into()); }
  let salt = SaltString::generate(&mut OsRng);
  let hash = Argon2::default().hash_password(password.as_bytes(), &salt).map_err(|_| "AUTH_UNAVAILABLE")?.to_string();
  let id = format!("staff-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos()); let stamp = now();
  tx.execute("INSERT INTO staff_users (id, username, password_hash, display_name, role, is_active, created_at, updated_at, password_updated_at) VALUES (?1, ?2, ?3, ?4, 'admin', 1, ?5, ?5, ?5)", params![id, username, hash, name, stamp]).map_err(|_| "AUTH_USERNAME_TAKEN")?;
  audit(&tx, Some(&id), "auth.bootstrap", &id)?; tx.commit().map_err(|_| "AUTH_UNAVAILABLE")?;
  let user = SafeUser { id, display_name:name, username, role:"admin".into() }; *state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")? = Some(user.clone()); Ok(user)
}
#[tauri::command]
fn sign_in(app: AppHandle, state: State<AuthState>, username: String, password: String) -> Result<SafeUser, String> {
  let db = open_db(&app)?; let username = normalize_username(&username);
  let row: Option<(String,String,String,String,String,i64,Option<String>)> = db.query_row("SELECT id,display_name,username,role,password_hash,failed_login_count,locked_until FROM staff_users WHERE username=?1 AND is_active=1 AND length(trim(password_hash))>0", [username], |r| Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?,r.get(5)?,r.get(6)?))).optional().map_err(|_| "AUTH_UNAVAILABLE")?;
  let Some((id,name,username,role,hash,failures,locked)) = row else { return Err("AUTH_INVALID_CREDENTIALS".into()) };
  if locked.and_then(|v| v.parse::<u64>().ok()).is_some_and(|v| v > epoch()) { return Err("AUTH_ACCOUNT_LOCKED".into()); }
  let valid = PasswordHash::new(&hash).ok().and_then(|h| Argon2::default().verify_password(password.as_bytes(), &h).ok()).is_some();
  if !valid { let next = failures + 1; let until = (next >= MAX_LOGIN_FAILURES).then(|| (epoch()+LOCK_SECONDS).to_string()); db.execute("UPDATE staff_users SET failed_login_count=?1, locked_until=?2, updated_at=?3 WHERE id=?4", params![next,until,now(),id]).map_err(|_| "AUTH_UNAVAILABLE")?; let code = if next >= MAX_LOGIN_FAILURES { "AUTH_ACCOUNT_LOCKED" } else { "AUTH_INVALID_CREDENTIALS" }; return Err(code.into()); }
  db.execute("UPDATE staff_users SET failed_login_count=0, locked_until=NULL, updated_at=?1 WHERE id=?2", params![now(),id]).map_err(|_| "AUTH_UNAVAILABLE")?; audit(&db, Some(&id), "auth.sign_in", &id)?;
  let user=SafeUser{id,display_name:name,username,role}; *state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?=Some(user.clone()); Ok(user)
}
#[tauri::command]
fn sign_out(app: AppHandle, state: State<AuthState>) -> Result<(), String> { if let Some(user)=state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?.take() { let db=open_db(&app)?; audit(&db,Some(&user.id),"auth.sign_out",&user.id)?; } Ok(()) }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    tauri_plugin_sql::Migration { version: 1, description: "create_clinic_core_schema", sql: include_str!("../migrations/0001_clinic_core_schema.sql"), kind: tauri_plugin_sql::MigrationKind::Up },
    tauri_plugin_sql::Migration { version: 2, description: "add_auth_security_fields", sql: include_str!("../migrations/0002_auth_security.sql"), kind: tauri_plugin_sql::MigrationKind::Up },
  ];
  tauri::Builder::default().manage(AuthState(Mutex::new(None))).invoke_handler(tauri::generate_handler![auth_status, bootstrap_first_admin, sign_in, sign_out, current_user]).plugin(tauri_plugin_sql::Builder::default().add_migrations("sqlite:clinic-desk.db", migrations).build()).setup(|app| { if cfg!(debug_assertions) { app.handle().plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())?; } Ok(()) }).run(tauri::generate_context!()).expect("error while building tauri application");
}
