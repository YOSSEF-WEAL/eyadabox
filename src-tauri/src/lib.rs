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
struct SafeUser { id: String, display_name: String, username: String, role: String, avatar_data_url: Option<String>, profile_phone: Option<String>, profile_bio: Option<String> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AuthStatus { requires_setup: bool, authenticated: bool, user: Option<SafeUser> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BackupInfo { name: String }
struct AuthState(Mutex<Option<SafeUser>>);

fn epoch() -> u64 { std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs() }
fn timestamp_millis() -> u128 { std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis() }
fn now() -> String { epoch().to_string() }
fn normalize_username(value: &str) -> String { value.trim().to_lowercase() }
fn valid_username(value: &str) -> bool { let n = value.len(); n >= 3 && n <= 50 && value.bytes().all(|c| c.is_ascii_alphanumeric() || matches!(c, b'.' | b'_' | b'-')) }
fn valid_password(value: &str) -> bool { (10..=200).contains(&value.chars().count()) }
fn open_db(app: &AppHandle) -> Result<Connection, String> {
  let dir = app.path().app_data_dir().map_err(|_| "AUTH_UNAVAILABLE")?;
  std::fs::create_dir_all(&dir).map_err(|_| "AUTH_UNAVAILABLE")?;
  let db = Connection::open(dir.join("clinic-desk.db")).map_err(|_| "AUTH_UNAVAILABLE".to_owned())?;
  db.busy_timeout(std::time::Duration::from_secs(5)).map_err(|_| "AUTH_UNAVAILABLE")?;
  Ok(db)
}
fn local_db_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
  let dir = app.path().app_data_dir().map_err(|_| "DATABASE_RECOVERY_UNAVAILABLE")?;
  std::fs::create_dir_all(&dir).map_err(|_| "DATABASE_RECOVERY_UNAVAILABLE")?;
  Ok(dir.join("clinic-desk.db"))
}
fn required(db: &Connection) -> Result<bool, String> { db.query_row("SELECT NOT EXISTS(SELECT 1 FROM staff_users WHERE is_active = 1 AND length(trim(password_hash)) > 0)", [], |r| r.get(0)).map_err(|_| "AUTH_UNAVAILABLE".into()) }
fn audit_event(db: &Connection, actor: Option<&str>, action: &str, entity_type: &str, entity_id: &str, details_json: Option<&str>) -> Result<(), String> {
  db.execute("INSERT INTO audit_log (id, actor_staff_user_id, action, entity_type, entity_id, details_json, created_at) VALUES (lower(hex(randomblob(16))), ?1, ?2, ?3, ?4, ?5, ?6)", params![actor, action, entity_type, entity_id, details_json, now()]).map_err(|_| "AUTH_UNAVAILABLE")?; Ok(())
}
fn audit(db: &Connection, actor: Option<&str>, action: &str, entity: &str) -> Result<(), String> {
  audit_event(db, actor, action, "staff_user", entity, None)
}
fn lookup_active(db: &Connection, id: &str) -> Result<Option<SafeUser>, String> {
  db.query_row("SELECT id, display_name, username, role, avatar_data_url, profile_phone, profile_bio FROM staff_users WHERE id=?1 AND is_active=1 AND length(trim(password_hash))>0", [id], |r| Ok(SafeUser { id:r.get(0)?, display_name:r.get(1)?, username:r.get(2)?, role:r.get(3)?, avatar_data_url:r.get(4)?, profile_phone:r.get(5)?, profile_bio:r.get(6)? })).optional().map_err(|_| "AUTH_UNAVAILABLE".into())
}
fn start_session(db: &Connection, user: &SafeUser) -> Result<(), String> {
  let days: u64 = db.query_row("SELECT COALESCE(session_expiry_days, 30) FROM clinic_settings WHERE id='default'", [], |r| r.get(0)).unwrap_or(30);
  db.execute("INSERT OR REPLACE INTO auth_sessions (id, staff_user_id, expires_at, created_at) VALUES ('local', ?1, ?2, ?3)", params![user.id, epoch().saturating_add(days.saturating_mul(86_400)), now()]).map_err(|_| "AUTH_UNAVAILABLE")?; Ok(())
}
fn saved_session(db: &Connection) -> Result<Option<SafeUser>, String> {
  let id: Option<String> = db.query_row("SELECT staff_user_id FROM auth_sessions WHERE id='local' AND expires_at > ?1", [epoch()], |r| r.get(0)).optional().map_err(|_| "AUTH_UNAVAILABLE")?;
  db.execute("DELETE FROM auth_sessions WHERE expires_at <= ?1", [epoch()]).map_err(|_| "AUTH_UNAVAILABLE")?;
  match id { Some(value) => lookup_active(db, &value), None => Ok(None) }
}

#[tauri::command]
fn auth_status(app: AppHandle, state: State<AuthState>) -> Result<AuthStatus, String> {
  let db = open_db(&app)?; let requires_setup = required(&db)?;
  let in_memory = state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?.clone();
  let user = match in_memory { Some(u) => lookup_active(&db, &u.id)?, None => saved_session(&db)? };
  *state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")? = user.clone();
  Ok(AuthStatus { requires_setup, authenticated: user.is_some(), user })
}
#[tauri::command]
fn current_user(app: AppHandle, state: State<AuthState>) -> Result<Option<SafeUser>, String> {
  let db = open_db(&app)?; let current = state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?.clone();
  match current { Some(u) => lookup_active(&db, &u.id), None => saved_session(&db) }
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
  let user = SafeUser { id, display_name:name, username, role:"admin".into(), avatar_data_url:None, profile_phone:None, profile_bio:None }; start_session(&db, &user)?; *state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")? = Some(user.clone()); Ok(user)
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
  let user=SafeUser{id,display_name:name,username,role,avatar_data_url:None,profile_phone:None,profile_bio:None}; start_session(&db, &user)?; *state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?=Some(user.clone()); Ok(user)
}
#[tauri::command]
fn sign_out(app: AppHandle, state: State<AuthState>) -> Result<(), String> { let db=open_db(&app)?; db.execute("DELETE FROM auth_sessions WHERE id='local'", []).map_err(|_| "AUTH_UNAVAILABLE")?; if let Some(user)=state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?.take() { audit(&db,Some(&user.id),"auth.sign_out",&user.id)?; } Ok(()) }
#[tauri::command]
fn update_profile(app: AppHandle, state: State<AuthState>, display_name: String, profile_phone: Option<String>, profile_bio: Option<String>, avatar_data_url: Option<String>) -> Result<SafeUser, String> {
  let name = display_name.trim().to_owned(); if name.is_empty() { return Err("PROFILE_DISPLAY_NAME_REQUIRED".into()); }
  if avatar_data_url.as_ref().is_some_and(|value| !value.starts_with("data:image/") || value.len() > 2_800_000) { return Err("PROFILE_AVATAR_INVALID".into()); }
  let current = state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?.clone().ok_or("AUTH_INVALID_CREDENTIALS")?;
  let db = open_db(&app)?; db.execute("UPDATE staff_users SET display_name=?1, profile_phone=?2, profile_bio=?3, avatar_data_url=?4, updated_at=?5 WHERE id=?6", params![name, profile_phone.map(|v| v.trim().to_owned()).filter(|v| !v.is_empty()), profile_bio.map(|v| v.trim().to_owned()).filter(|v| !v.is_empty()), avatar_data_url, now(), current.id]).map_err(|_| "AUTH_UNAVAILABLE")?;
  let user = lookup_active(&db, &current.id)?.ok_or("AUTH_UNAVAILABLE")?; *state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")? = Some(user.clone()); Ok(user)
}
#[tauri::command]
fn change_password(app: AppHandle, state: State<AuthState>, current_password: String, new_password: String) -> Result<(), String> {
  if !valid_password(&new_password) { return Err("AUTH_PASSWORD_WEAK".into()); }
  let current = state.0.lock().map_err(|_| "AUTH_UNAVAILABLE")?.clone().ok_or("AUTH_INVALID_CREDENTIALS")?;
  let db = open_db(&app)?; let hash: String = db.query_row("SELECT password_hash FROM staff_users WHERE id=?1 AND is_active=1", [&current.id], |r| r.get(0)).map_err(|_| "AUTH_INVALID_CREDENTIALS")?;
  let valid = PasswordHash::new(&hash).ok().and_then(|value| Argon2::default().verify_password(current_password.as_bytes(), &value).ok()).is_some();
  if !valid { return Err("AUTH_INVALID_CREDENTIALS".into()); }
  let salt = SaltString::generate(&mut OsRng); let next_hash = Argon2::default().hash_password(new_password.as_bytes(), &salt).map_err(|_| "AUTH_UNAVAILABLE")?.to_string();
  db.execute("UPDATE staff_users SET password_hash=?1, password_updated_at=?2, updated_at=?2 WHERE id=?3", params![next_hash, now(), current.id]).map_err(|_| "AUTH_UNAVAILABLE")?; audit(&db, Some(&current.id), "auth.change_password", &current.id)?; Ok(())
}
#[tauri::command]
fn reset_local_database(app: AppHandle) -> Result<String, String> {
  let database_path = local_db_path(&app)?;
  if !database_path.exists() { return Ok(String::new()); }
  let backup_dir = database_path.parent().ok_or("DATABASE_RECOVERY_UNAVAILABLE")?.join("backups");
  std::fs::create_dir_all(&backup_dir).map_err(|_| "DATABASE_RECOVERY_UNAVAILABLE")?;
  let stamp = epoch();
  let backup_name = format!("clinic-desk-{stamp}.db");
  for suffix in ["", "-wal", "-shm"] {
    let source = std::path::PathBuf::from(format!("{}{suffix}", database_path.display()));
    if source.exists() {
      let target = backup_dir.join(format!("{backup_name}{suffix}"));
      std::fs::rename(source, target).map_err(|_| "DATABASE_RECOVERY_UNAVAILABLE")?;
    }
  }
  Ok(backup_name)
}

fn backup_directory(app: &AppHandle) -> Result<std::path::PathBuf, String> {
  let database_path = local_db_path(app).map_err(|_| "BACKUP_UNAVAILABLE")?;
  let directory = database_path.parent().ok_or("BACKUP_UNAVAILABLE")?.join("backups");
  std::fs::create_dir_all(&directory).map_err(|_| "BACKUP_UNAVAILABLE")?;
  Ok(directory)
}
fn is_backup_name(name: &str) -> bool {
  std::path::Path::new(name).file_name().and_then(|value| value.to_str()) == Some(name)
    && name.starts_with("clinic-desk-") && name.ends_with(".db")
}
fn move_current_database_to_backup(app: &AppHandle, name: &str) -> Result<(), String> {
  let database_path = local_db_path(app).map_err(|_| "RESTORE_UNAVAILABLE")?;
  let directory = backup_directory(app).map_err(|_| "RESTORE_UNAVAILABLE")?;
  for suffix in ["", "-wal", "-shm"] {
    let source = std::path::PathBuf::from(format!("{}{suffix}", database_path.display()));
    if source.exists() {
      std::fs::rename(&source, directory.join(format!("{name}{suffix}"))).map_err(|_| "RESTORE_UNAVAILABLE")?;
    }
  }
  Ok(())
}
fn apply_pending_restore(app: &AppHandle) -> Result<(), String> {
  let database_path = local_db_path(app).map_err(|_| "RESTORE_UNAVAILABLE")?;
  let directory = database_path.parent().ok_or("RESTORE_UNAVAILABLE")?;
  let pending = directory.join("restore-pending.db");
  let marker = directory.join("restore-pending.flag");
  let factory_reset = directory.join("factory-reset.flag");
  if factory_reset.exists() { let before = format!("clinic-desk-before-factory-reset-{}.db", timestamp_millis()); move_current_database_to_backup(app, &before)?; let _ = std::fs::remove_file(&pending); let _ = std::fs::remove_file(&marker); std::fs::remove_file(factory_reset).map_err(|_| "RESTORE_UNAVAILABLE")?; return Ok(()); }
  if !marker.exists() { return Ok(()); }
  if !pending.exists() { std::fs::remove_file(marker).map_err(|_| "RESTORE_UNAVAILABLE")?; return Ok(()); }
  move_current_database_to_backup(app, &format!("clinic-desk-before-restore-{}.db", timestamp_millis()))?;
  std::fs::copy(&pending, &database_path).map_err(|_| "RESTORE_UNAVAILABLE")?;
  std::fs::remove_file(&pending).map_err(|_| "RESTORE_UNAVAILABLE")?;
  std::fs::remove_file(marker).map_err(|_| "RESTORE_UNAVAILABLE")?;
  Ok(())
}
#[tauri::command]
fn list_local_backups(app: AppHandle, state: State<AuthState>) -> Result<Vec<BackupInfo>, String> {
  require_admin(&app, &state)?;
  let directory = backup_directory(&app)?;
  let mut backups = std::fs::read_dir(directory).map_err(|_| "BACKUP_UNAVAILABLE")?
    .filter_map(Result::ok)
    .filter_map(|entry| entry.file_name().into_string().ok())
    .filter(|name| is_backup_name(name))
    .map(|name| BackupInfo { name })
    .collect::<Vec<_>>();
  backups.sort_by(|a, b| b.name.cmp(&a.name));
  Ok(backups)
}
#[tauri::command]
fn create_local_backup(app: AppHandle, state: State<AuthState>) -> Result<BackupInfo, String> {
  let user = require_admin(&app, &state)?;
  let directory = backup_directory(&app)?;
  let name = format!("clinic-desk-backup-{}.db", timestamp_millis());
  let destination = directory.join(&name);
  let db = open_db(&app).map_err(|_| "BACKUP_UNAVAILABLE")?;
  db.execute("VACUUM INTO ?1", [destination.to_string_lossy().to_string()]).map_err(|_| "BACKUP_UNAVAILABLE")?;
  audit_event(&db, Some(&user.id), "backup.create", "local_backup", &name, None)?;
  Ok(BackupInfo { name })
}
#[tauri::command]
fn schedule_local_restore(app: AppHandle, state: State<AuthState>, backup_name: String, confirmation: String) -> Result<(), String> {
  if confirmation != "DELETE" { return Err("DANGER_ZONE_CONFIRMATION_REQUIRED".into()); }
  let user = require_admin(&app, &state)?;
  if !is_backup_name(&backup_name) { return Err("RESTORE_INVALID_BACKUP".into()); }
  let source = backup_directory(&app)?.join(&backup_name);
  if !source.is_file() { return Err("RESTORE_INVALID_BACKUP".into()); }
  let database_path = local_db_path(&app).map_err(|_| "RESTORE_UNAVAILABLE")?;
  let directory = database_path.parent().ok_or("RESTORE_UNAVAILABLE")?;
  let pending = directory.join("restore-pending.db");
  let marker = directory.join("restore-pending.flag");
  std::fs::copy(source, pending).map_err(|_| "RESTORE_UNAVAILABLE")?;
  std::fs::write(marker, &backup_name).map_err(|_| "RESTORE_UNAVAILABLE")?;
  let db = open_db(&app).map_err(|_| "RESTORE_UNAVAILABLE")?;
  audit_event(&db, Some(&user.id), "backup.restore", "local_backup", &backup_name, None)?;
  drop(db);
  app.restart()
}
fn require_admin(app: &AppHandle, state: &State<AuthState>) -> Result<SafeUser, String> {
  let cached = state.0.lock().map_err(|_| "DANGER_ZONE_FORBIDDEN")?.clone();
  let db = open_db(app).map_err(|_| "DANGER_ZONE_FORBIDDEN")?;
  let user = match cached { Some(current) => lookup_active(&db, &current.id)?, None => saved_session(&db)? }.ok_or("DANGER_ZONE_FORBIDDEN")?;
  if user.role != "admin" { return Err("DANGER_ZONE_FORBIDDEN".into()); }
  *state.0.lock().map_err(|_| "DANGER_ZONE_FORBIDDEN")? = Some(user.clone());
  Ok(user)
}
fn create_safety_backup(app: &AppHandle) -> Result<String, String> {
  let name = format!("clinic-desk-safety-{}.db", timestamp_millis()); let destination = backup_directory(app).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?.join(&name); let db = open_db(app).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?;
  db.execute("VACUUM INTO ?1", [destination.to_string_lossy().to_string()]).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; Ok(name)
}
#[tauri::command]
fn danger_zone_action(app: AppHandle, state: State<AuthState>, action: String, confirmation: String) -> Result<String, String> {
  if confirmation != "DELETE" { return Err("DANGER_ZONE_CONFIRMATION_REQUIRED".into()); }
  if !matches!(action.as_str(), "appointments" | "patients" | "practitioners" | "operational" | "factory_reset") { return Err("DANGER_ZONE_INVALID_ACTION".into()); }
  let user = require_admin(&app, &state)?; let backup = create_safety_backup(&app)?;
  let details = serde_json::json!({ "backup": backup }).to_string();
  if action == "factory_reset" { let db=open_db(&app).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; audit_event(&db,Some(&user.id),"danger.factory_reset","local_database","local_database",Some(&details))?; let dir=local_db_path(&app).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?.parent().ok_or("DANGER_ZONE_UNAVAILABLE")?.to_path_buf(); std::fs::write(dir.join("factory-reset.flag"),"1").map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; app.restart() }
  let mut db = open_db(&app).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; let tx=db.transaction().map_err(|_| "DANGER_ZONE_UNAVAILABLE")?;
  audit_event(&tx,Some(&user.id),&format!("danger.{action}"),"clinic_data","clinic_data",Some(&details))?;
  match action.as_str() {
    "appointments" => { tx.execute("DELETE FROM appointments", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; }
    "patients" => { tx.execute("DELETE FROM appointments", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; tx.execute("DELETE FROM patients", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; }
    "practitioners" => { tx.execute("DELETE FROM appointments", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; tx.execute("DELETE FROM working_hours", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; tx.execute("DELETE FROM practitioners", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; }
    "operational" => { tx.execute("DELETE FROM appointments", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; tx.execute("DELETE FROM patients", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; tx.execute("DELETE FROM working_hours", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; tx.execute("DELETE FROM practitioners", []).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; }
    _ => return Err("DANGER_ZONE_INVALID_ACTION".into()),
  }
  tx.commit().map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; Ok(backup)
}
#[tauri::command]
fn delete_local_backup(app: AppHandle, state: State<AuthState>, backup_name: String, confirmation: String) -> Result<(), String> {
  if confirmation != "DELETE" { return Err("DANGER_ZONE_CONFIRMATION_REQUIRED".into()); } let user = require_admin(&app,&state)?; if !is_backup_name(&backup_name) { return Err("RESTORE_INVALID_BACKUP".into()); }
  let path=backup_directory(&app)?.join(&backup_name); if !path.is_file() { return Err("RESTORE_INVALID_BACKUP".into()); }
  let db=open_db(&app).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; audit_event(&db,Some(&user.id),"backup.delete","local_backup",&backup_name,None)?;
  std::fs::remove_file(&path).map_err(|_| "DANGER_ZONE_UNAVAILABLE".to_owned())?; Ok(())
}
#[tauri::command]
fn export_clinic_data(app: AppHandle, state: State<AuthState>, kind: String) -> Result<String, String> {
  let user=require_admin(&app,&state)?; let dir=local_db_path(&app).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?.parent().ok_or("DANGER_ZONE_UNAVAILABLE")?.join("exports"); std::fs::create_dir_all(&dir).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; let db=open_db(&app).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?;
  let (file, sql, header)=match kind.as_str() { "patients"=>(format!("clinic-desk-patients-{}.csv",timestamp_millis()),"SELECT id, full_name, COALESCE(phone,''), COALESCE(date_of_birth,'') FROM patients ORDER BY full_name","id,full_name,phone,date_of_birth\n"), "appointments"=>(format!("clinic-desk-appointments-{}.csv",timestamp_millis()),"SELECT id, patient_id, practitioner_id, starts_at, ends_at, status, COALESCE(reason,'') FROM appointments ORDER BY starts_at DESC","id,patient_id,practitioner_id,starts_at,ends_at,status,reason\n"), _=>return Err("DANGER_ZONE_INVALID_ACTION".into()) };
  let mut csv=header.to_owned(); let mut statement=db.prepare(sql).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; let count=if kind=="patients" {4} else {7}; let rows=statement.query_map([],move |row| { let mut values=Vec::new(); for index in 0..count { values.push(row.get::<_,String>(index)?); } Ok(values) }).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; for row in rows { let values=row.map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; csv.push_str(&values.into_iter().map(|value| format!("\"{}\"",value.replace('"',"\"\""))).collect::<Vec<_>>().join(",")); csv.push('\n'); } std::fs::write(dir.join(&file),csv).map_err(|_| "DANGER_ZONE_UNAVAILABLE")?; audit_event(&db,Some(&user.id),"data.export","clinic_data",&kind,None)?; Ok(file)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    tauri_plugin_sql::Migration { version: 1, description: "create_clinic_core_schema", sql: include_str!("../migrations/0001_clinic_core_schema.sql"), kind: tauri_plugin_sql::MigrationKind::Up },
    tauri_plugin_sql::Migration { version: 2, description: "add_auth_security_fields", sql: include_str!("../migrations/0002_auth_security.sql"), kind: tauri_plugin_sql::MigrationKind::Up },
    tauri_plugin_sql::Migration { version: 3, description: "add_staff_profile_fields", sql: include_str!("../migrations/0003_staff_profile.sql"), kind: tauri_plugin_sql::MigrationKind::Up },
    tauri_plugin_sql::Migration { version: 4, description: "add_local_sessions", sql: include_str!("../migrations/0004_sessions_and_settings.sql"), kind: tauri_plugin_sql::MigrationKind::Up },
  ];
  tauri::Builder::default().manage(AuthState(Mutex::new(None))).invoke_handler(tauri::generate_handler![auth_status, bootstrap_first_admin, sign_in, sign_out, current_user, update_profile, change_password, reset_local_database, list_local_backups, create_local_backup, schedule_local_restore, danger_zone_action, delete_local_backup, export_clinic_data]).plugin(tauri_plugin_sql::Builder::default().add_migrations("sqlite:clinic-desk.db", migrations).build()).plugin(tauri_plugin_updater::Builder::new().build()).setup(|app| { apply_pending_restore(app.handle()).map_err(std::io::Error::other)?; if cfg!(debug_assertions) { app.handle().plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())?; } Ok(()) }).run(tauri::generate_context!()).expect("error while building tauri application");
}
