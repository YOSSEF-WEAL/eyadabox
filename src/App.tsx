import { Route, BrowserRouter as Router, Routes } from "react-router";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppLayout from "./layout/AppLayout";
import ClinicAuth from "./pages/AuthPages/ClinicAuth";
import { RequireAdmin, RequireAuth } from "./features/auth/RequireAuth";
import Calendar from "./pages/Calendar";
import BarChart from "./pages/Charts/BarChart";
import LineChart from "./pages/Charts/LineChart";
import Dashboard from "./pages/Clinic/Dashboard";
import Appointments from "./pages/Clinic/Appointments";
import Patients from "./pages/Clinic/Patients";
import PatientDetails from "./pages/Clinic/PatientDetails";
import Practitioners from "./pages/Clinic/Practitioners";
import PractitionerDetails from "./pages/Clinic/PractitionerDetails";
import PractitionerEditor from "./pages/Clinic/PractitionerEditor";
import Settings from "./pages/Clinic/Settings";
import Staff from "./pages/Clinic/Staff";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/OtherPage/Blank";
import NotFound from "./pages/OtherPage/NotFound";
import BasicTables from "./pages/Tables/BasicTables";
import Alerts from "./pages/UiElements/Alerts";
import Avatars from "./pages/UiElements/Avatars";
import Badges from "./pages/UiElements/Badges";
import Buttons from "./pages/UiElements/Buttons";
import Images from "./pages/UiElements/Images";
import Videos from "./pages/UiElements/Videos";
import UserProfiles from "./pages/UserProfiles";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Dashboard />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:patientId" element={<PatientDetails />} />
            <Route path="/practitioners" element={<Practitioners />} />
            <Route path="/practitioners/new" element={<PractitionerEditor />} />
            <Route
              path="/practitioners/:practitionerId"
              element={<PractitionerDetails />}
            />
            <Route
              path="/practitioners/:practitionerId/edit"
              element={<PractitionerEditor />}
            />
            <Route element={<RequireAdmin />}>
              <Route path="/settings" element={<Settings />} />
              <Route path="/staff" element={<Staff />} />
            </Route>

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<ClinicAuth />} />
          <Route path="/setup" element={<ClinicAuth setup />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
