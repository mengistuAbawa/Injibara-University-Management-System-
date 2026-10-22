import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GraduatedStudents from './pages/GraduatedStudents';
import NotFound from './pages/NotFound';
import StudentLayout from './components/StudentLayout';
import InstructorLayout from './components/InstructorLayout';
import RegistrarLayout from './components/RegistrarLayout';
import HodLayout from './components/HodLayout';
import AdminLayout from './components/AdminLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import PlacementTutorials from './pages/student/PlacementTutorials';
import MyCourse from './pages/student/MyCourse';
import MyStatus from './pages/student/MyStatus';
import MyGrade from './pages/student/MyGrade';
import FieldSelection from './pages/student/FieldSelection';
import SelectDepartments from './pages/student/SelectDepartments';
import SelectionResultsSummary from './pages/student/SelectionResultsSummary';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import MySections from './pages/instructor/MySections';
import SectionStudents from './pages/instructor/SectionStudents';
import EnterGrades from './pages/instructor/EnterGrades';
import TakeAttendance from './pages/instructor/TakeAttendance';
import RegistrarDashboard from './pages/registrar/RegistrarDashboard';
import CreateStudent from './pages/registrar/CreateStudent';
import EnrollStudent from './pages/registrar/EnrollStudent';
import PublishResults from './pages/registrar/PublishResults';
import ViewTranscript from './pages/registrar/ViewTranscript';
import ManageStudents from './pages/registrar/ManageStudents';
import SectionEnrollments from './pages/registrar/SectionEnrollments';
import RegistrationRequests from './pages/registrar/RegistrationRequests';
import HodDashboard from './pages/hod/HodDashboard';
import DepartmentOverview from './pages/hod/DepartmentOverview';
import AssignInstructor from './pages/hod/AssignInstructor';
import PerformanceReport from './pages/hod/PerformanceReport';
import Students from './pages/hod/Students';
import HodManageCourses from './pages/hod/ManageCourses';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageCourses from './pages/admin/ManageCourses';
import ManageSections from './pages/admin/ManageSections';
import ManageFields from './pages/admin/ManageFields';
import AdminManageStudents from './pages/admin/ManageStudents';
import ManageInstructors from './pages/admin/ManageInstructors';
import SystemSettings from './pages/admin/SystemSettings';
import Reports from './pages/admin/Reports';
import ClassPerformance from './pages/instructor/ClassPerformance';
import AccessRequests from './pages/AccessRequests';
import StudentAccounts from './pages/registrar/StudentAccounts';
import AssignInstructorSections from './pages/registrar/AssignInstructorSections';
import ApplyWizard from './pages/apply/ApplyWizard';
import ApplicationStatus from './pages/apply/ApplicationStatus';
import SuccessPage from './pages/apply/SuccessPage';
import AlumniLayout from './layouts/AlumniLayout';
import AlumniDashboard from './pages/alumni/AlumniDashboard';
import RequestDocument from './pages/alumni/RequestDocument';
import MyRequests from './pages/alumni/MyRequests';
import AlumniProfile from './pages/alumni/AlumniProfile';
import Transcript from './pages/alumni/Transcript';
import FinanceLayout from './layouts/FinanceLayout';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import FeeTypes from './pages/finance/FeeTypes';
import Invoices from './pages/finance/Invoices';
import CreateInvoice from './pages/finance/CreateInvoice';
import Payments from './pages/finance/Payments';
import FinanceReports from './pages/finance/Reports';
import StudentStatement from './pages/finance/StudentStatement';
import MyFees from './pages/student/MyFees';
import DeanLayout from './components/DeanLayout';
import DeanDashboard from './pages/dean/DeanDashboard';
import DeanManageDepartments from './pages/dean/ManageDepartments';
import ManageOfferings from './pages/dean/ManageOfferings';
import GradeApprovals from './pages/dean/GradeApprovals';
import DeanStatistics from './pages/dean/Statistics';
import AllocationResults from './pages/dean/AllocationResults';
import HodMonitor from './pages/dean/HodMonitor';
import NgStudents from './pages/dean/NgStudents';
import TopStudents from './pages/dean/TopStudents';

export default function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/welcome" element={<HomePage welcomeOnly />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register-account" element={<RegisterPage />} />
    <Route path="/graduated" element={<GraduatedStudents />} />
    <Route path="/apply" element={<ApplyWizard />} />
    <Route path="/apply/status" element={<ApplicationStatus />} />
    <Route path="/apply/success" element={<SuccessPage />} />
    <Route element={<StudentLayout />}>
      <Route path="/dashboard" element={<StudentDashboard />} />
      <Route path="/register" element={<Navigate to="/my-course" replace />} />
      <Route path="/placement-tutorials" element={<PlacementTutorials />} />
      <Route path="/my-course" element={<MyCourse />} />
      <Route path="/my-status" element={<MyStatus />} />
      <Route path="/my-grade" element={<MyGrade />} />
      <Route path="/field-selection" element={<FieldSelection />} />
      <Route path="/field-selection/select" element={<SelectDepartments />} />
      <Route path="/selection-results" element={<SelectionResultsSummary />} />
      <Route path="/my-fees" element={<MyFees />} />
    </Route>
    <Route element={<AlumniLayout />}>
      <Route path="/alumni/dashboard" element={<AlumniDashboard />} />
      <Route path="/alumni/request" element={<RequestDocument />} />
      <Route path="/alumni/requests" element={<MyRequests />} />
      <Route path="/alumni/profile" element={<AlumniProfile />} />
      <Route path="/alumni/transcript" element={<Transcript />} />
    </Route>
    <Route element={<FinanceLayout />}>
      <Route path="/finance/dashboard" element={<FinanceDashboard />} />
      <Route path="/finance/fees" element={<FeeTypes />} />
      <Route path="/finance/invoices" element={<Invoices />} />
      <Route path="/finance/invoices/create" element={<CreateInvoice />} />
      <Route path="/finance/payments" element={<Payments />} />
      <Route path="/finance/reports" element={<FinanceReports />} />
      <Route path="/finance/students/:id" element={<StudentStatement />} />
    </Route>
    <Route element={<InstructorLayout />}>
      <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
      <Route path="/instructor/sections" element={<MySections />} />
      <Route path="/instructor/sections/:sectionId" element={<SectionStudents />} />
      <Route path="/instructor/grades" element={<EnterGrades />} />
      <Route path="/instructor/attendance" element={<TakeAttendance />} />
      <Route path="/instructor/performance" element={<ClassPerformance />} />
    </Route>
    <Route element={<RegistrarLayout />}>
      <Route path="/registrar/dashboard" element={<RegistrarDashboard />} />
      <Route path="/registrar/access-requests" element={<AccessRequests office="registrar" />} />
      <Route path="/registrar/assign-instructor/:instructorId" element={<AssignInstructorSections />} />
      <Route path="/registrar/accounts" element={<StudentAccounts />} />
      <Route path="/registrar/create-student" element={<CreateStudent />} />
      <Route path="/registrar/enroll" element={<EnrollStudent />} />
      <Route path="/registrar/manage" element={<ManageStudents />} />
      <Route path="/registrar/sections" element={<SectionEnrollments />} />
      <Route path="/registrar/registration-requests" element={<RegistrationRequests />} />
      <Route path="/registrar/publish" element={<PublishResults />} />
      <Route path="/registrar/transcript" element={<ViewTranscript />} />
    </Route>
    <Route element={<HodLayout />}>
  <Route path="/hod/dashboard"   element={<HodDashboard />} />
  <Route path="/hod/overview"    element={<DepartmentOverview />} />
  <Route path="/hod/courses"     element={<HodManageCourses />} />
  <Route path="/hod/assign"      element={<AssignInstructor />} />
  <Route path="/hod/performance" element={<PerformanceReport />} />
  <Route path="/hod/students"    element={<Students />} />
</Route>
    <Route element={<DeanLayout />}>
      <Route path="/dean/dashboard" element={<DeanDashboard />} />
      <Route path="/dean/departments" element={<DeanManageDepartments />} />
      <Route path="/dean/offerings" element={<ManageOfferings />} />
      <Route path="/dean/grade-approvals" element={<GradeApprovals />} />
      <Route path="/dean/statistics" element={<DeanStatistics />} />
      <Route path="/dean/allocation-results" element={<AllocationResults />} />
      <Route path="/dean/hods" element={<HodMonitor />} />
      <Route path="/dean/ng-students" element={<NgStudents />} />
      <Route path="/dean/top-students" element={<TopStudents />} />
    </Route>
    <Route element={<AdminLayout />}>
  <Route path="/admin/dashboard"   element={<AdminDashboard />} />
  <Route path="/admin/users"       element={<ManageUsers />} />
  <Route path="/admin/access-requests" element={<AccessRequests office="admin" />} />
  <Route path="/admin/departments" element={<ManageDepartments />} />
  <Route path="/admin/courses"     element={<ManageCourses />} />
  <Route path="/admin/sections"    element={<ManageSections />} />
  <Route path="/admin/fields"      element={<ManageFields />} />
  <Route path="/admin/students"    element={<AdminManageStudents />} />
  <Route path="/admin/instructors" element={<ManageInstructors />} />
  <Route path="/admin/settings"    element={<SystemSettings />} />
  <Route path="/admin/reports"     element={<Reports />} />
</Route>
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
