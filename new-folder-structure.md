DIGISTALL/
│
├── README.md
├��─ .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── server.js
├── Start-all.ps1
├── deploy-to-droplet.sh
│
│
│   ┌───────────────────────────────────────────────────────────────��─────┐
│   │                 SHARED RESOURCES & CONFIGURATION                    │
│   └─────────────────────────────────────────────────────────────────────┘
│
├── config/
│   ├── app.config.js
│   ├── database.config.js
│   ├── auth.config.js
│   ├── cors.config.js
│   ├── mail.config.js
│   ├── multer.config.js
│   └── roles.config.js
│
├── database/
│   ├── connection.js
│   ├── migrations/
│   │   ├── 001_create_users_table.sql
│   │   ├── 002_create_roles_table.sql
│   │   ├── 003_create_stalls_table.sql
│   │   ├── 004_create_applications_table.sql
│   │   ├── 005_create_payments_table.sql
│   │   ├── 006_create_violations_table.sql
│   │   ├── 007_create_inspections_table.sql
│   │   ├── 008_create_complaints_table.sql
��   │   └── 009_create_audit_logs_table.sql
│   ├── seeders/
│   │   ├── roles.seeder.js
│   │   ├── permissions.seeder.js
│   │   ├── default_admin.seeder.js
│   │   └── sample_data.seeder.js
│   ├── procedures/
│   │   ├── complaint_procedures.sql
│   │   ├── payment_procedures.sql
│   │   └── report_procedures.sql
│   └── schemas/
│       └── digistall_schema.sql
│
├── middleware/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   ├── validation.middleware.js
│   ├── error.middleware.js
│   ├── logger.middleware.js
│   ├── upload.middleware.js
│   └── sanitizer.middleware.js
│
├── helpers/
│   ├── response.helper.js
│   ├── encryption.helper.js
│   ├── date.helper.js
│   ├── file.helper.js
│   ├── validation.helper.js
│   ├── token.helper.js
│   ├── password.helper.js
│   └── pagination.helper.js
│
├── routes/
│   ├── index.routes.js
│   ├── api.routes.js
│   └── mobile.routes.js
│
├── shared/
│   ├── constants/
│   │   ├── status.constants.js
│   │   ├── roles.constants.js
│   │   ├── messages.constants.js
│   │   └── permissions.constants.js
│   ├── validators/
│   │   ├── user.validator.js
│   │   ├── stall.validator.js
│   │   ├── application.validator.js
│   │   └── payment.validator.js
│   ├── services/
│   │   ├── email.service.js
│   │   ├── sms.service.js
│   │   ├── notification.service.js
│   │   ├── audit.service.js
│   │   └── upload.service.js
│   └── base/
│       ├── BaseController.js
│       └── BaseModel.js
│
│
│   ╔═══════════════════════════════════════════════════════════════════════╗
│   ║                                                                       ║
│   ║              SYSTEM-ADMINISTRATOR (system_administrator)              ║
│   ║                        Database Account: system_administrator         ║
│   ║                                                                       		║
│   ╚═══════════════════════════════════════════════════════════════════════╝
│
├── SYSTEM-ADMINISTRATOR/
│   │
│   ├── BACKEND-WEB/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── DashboardController.js
│   │   │   ├── UserManagementController.js
│   │   │   ├── BusinessOwnerController.js
│   │   │   ├── SubscriptionController.js
│   │   │   ├── PaymentManagementController.js
│   │   │   ├── ReportController.js
│   │   │   ├── AuditLogController.js
│   │   │   ├── SystemConfigController.js
│   │   │   ├── BackupRestoreController.js
│   │   │   └── AuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── UserModel.js
│   │       ├── BusinessOwnerModel.js
│   │       ├── SubscriptionModel.js
│   │       ├── PaymentModel.js
│   │       ├── ReportModel.js
│   │       ├── AuditLogModel.js
│   │       ├── SystemConfigModel.js
│   │       └── BackupModel.js
│   │
│   ├── BACKEND-MOBILE/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── MobileDashboardController.js
│   │   │   ├── MobileUserController.js
│   │   │   ├── MobileReportController.js
│   │   │   └── MobileAuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── MobileUserModel.js
│   │       ├── MobileReportModel.js
│   │       └── MobileSyncModel.js
│   │
│   ├── FRONTEND-WEB/
│   │   │
│   │   └── VIEWS/
│   │       ├── layouts/
│   │       │   ├── SystemAdminLayout.vue
│   │       │   ├── Sidebar.vue
│   │       │   └── Navbar.vue
│   │       ├── pages/
│   │       │   ├── DashboardView.vue
│   │       │   ├── BusinessOwnersView.vue
│   │       │   ├── PaymentsView.vue
│   │       │   ├── ReportsView.vue
│   │       │   ├── SubscriptionsView.vue
│   │       │   ├── AuditLogsView.vue
│   │       │   └── SystemConfigView.vue
│   │       ├── components/
│   │       │   ├── BusinessOwnerTable.vue
│   │       │   ├── BusinessOwnerForm.vue
│   │       │   ├── PaymentTable.vue
│   │       │   ├── SubscriptionCard.vue
│   │       │   ├── ReportGenerator.vue
│   │       │   ├── AuditLogTable.vue
│   │       │   └── StatisticsCard.vue
│   │       └── modals/
│   │           ├── CreateBusinessOwnerModal.vue
│   │           ├── EditBusinessOwnerModal.vue
│   │           ├── ViewPaymentModal.vue
│   │           └── ConfirmActionModal.vue
│   │
│   └── FRONTEND-MOBILE/
│       │
│       └── VIEWS/
│           ├── screens/
│           │   ├── DashboardScreen.js
│           │   ├── BusinessOwnersScreen.js
│           │   ├── ReportsScreen.js
│           │   └── NotificationsScreen.js
│           └── components/
│               ├── StatCard.js
│               ├── BusinessOwnerCard.js
│               └── QuickActions.js
│
│
│   ╔═══════════════════════════════════════════════════════════════════════╗
│   ║                                                                       ║
│   ║                    LGU-NAGA (stall_business_owner)                    ║
│   ║                     Database Account: stall_business_owner            ║
│   ║                                                                       ║
│   ╚═══════════════════════════════════════════════════════════════════════╝
│
├── LGU-NAGA/
│   │
│   ├── BACKEND-WEB/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── DashboardController.js
│   │   │   ├── BranchController.js
│   │   │   ├── BranchManagerController.js
│   │   │   ├── StallController.js
│   │   │   ├── FloorSectionController.js
│   │   │   ├── ApplicationController.js
│   │   │   ├── StallholderController.js
│   │   │   ├── EmployeeController.js
│   │   │   ├── PaymentController.js
│   │   │   ├── ComplianceController.js
│   │   │   ├── ComplaintController.js
│   │   │   ├── VendorController.js
│   │   │   ��── ReportController.js
│   │   │   ├── SubscriptionController.js
│   │   │   └── AuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── BranchModel.js
│   │       ├── BranchManagerModel.js
│   │       ├── StallModel.js
│   │       ├── FloorModel.js
│   │       ├── SectionModel.js
│   │       ├── ApplicationModel.js
│   │       ├── StallholderModel.js
│   │       ├── EmployeeModel.js
│   │       ├── PaymentModel.js
│   │       ├── ComplianceModel.js
│   │       ├── ComplaintModel.js
│   │       ├── VendorModel.js
│   │       ├── ReportModel.js
│   │       └── SubscriptionModel.js
│   │
│   ├── BACKEND-MOBILE/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── MobileDashboardController.js
│   │   │   ├── MobileBranchController.js
│   │   │   ├── MobileStallController.js
│   │   │   ├── MobileApprovalController.js
│   │   │   ├── MobileReportController.js
│   │   │   └── MobileAuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── MobileBranchModel.js
│   │       ├── MobileStallModel.js
│   │       ├── MobileApprovalModel.js
│   │       └── MobileSyncModel.js
│   │
│   ├── FRONTEND-WEB/
│   │   │
│   │   └── VIEWS/
│   │       ├── layouts/
│   │       │   ├── LguLayout.vue
│   │       │   ├── Sidebar.vue
│   │       │   └── Navbar.vue
│   │       ├── pages/
│   │       │   ├── DashboardView.vue
│   │       │   ├── BranchManagementView.vue
│   │       │   ├── StallManagementView.vue
│   │       │   ├── ApplicantsView.vue
│   │       │   ├── StallholdersView.vue
│   │       │   ├── EmployeesView.vue
│   │       │   ├── PaymentView.vue
│   │       │   ├── ComplianceView.vue
│   │       │   ├── ComplaintsView.vue
│   │       │   ├── VendorsView.vue
│   │       │   ├── ReportsView.vue
│   │       │   └── SubscriptionView.vue
│   │       ├── components/
│   │       │   ├── BranchCard.vue
│   │       │   ├── BranchForm.vue
│   │       │   ├── BranchManagerTable.vue
│   │       │   ├── StallGrid.vue
│   │       │   ├── StallCard.vue
│   │       │   ├── StallForm.vue
│   │       │   ├── FloorManager.vue
│   │       │   ├── SectionManager.vue
│   │       │   ├── ApplicantTable.vue
│   │       │   ├── ApplicantDetail.vue
│   │       │   ├── ApprovalActions.vue
│   │       │   ├── StallholderTable.vue
│   │       │   ├── EmployeeTable.vue
│   │       │   ├── EmployeeForm.vue
│   │       │   ├── PaymentTable.vue
│   │       │   ├── ComplianceTable.vue
│   │       │   ├── ComplianceForm.vue
│   │       │   ├── ComplaintTable.vue
│   │       │   ├── VendorTable.vue
│   │       │   ├── RevenueChart.vue
│   │       │   └── StatisticsCard.vue
│   │       └── modals/
│   │           ├── CreateBranchModal.vue
│   │           ├── AssignManagerModal.vue
│   │           ├── CreateStallModal.vue
│   │           ├── ApproveApplicantModal.vue
│   │           ├── RejectApplicantModal.vue
│   │           ├── CreateEmployeeModal.vue
│   │           ├── CreateComplianceModal.vue
│   │           └── ViewComplaintModal.vue
│   │
│   └── FRONTEND-MOBILE/
│       │
│       └── VIEWS/
│           ├── screens/
│           │   ├── DashboardScreen.js
│           │   ├── BranchListScreen.js
│           │   ├── StallListScreen.js
│           │   ├── ApprovalListScreen.js
│           │   ├── ReportsScreen.js
│           │   └── NotificationsScreen.js
│           └── components/
│               ├── BranchCard.js
│               ├── StallMiniCard.js
│               ├── ApprovalCard.js
│               ├── RevenueWidget.js
│               └── QuickApproveButton.js
│
│
│   ╔═══════════════════════════════════════════════════════════════════════╗
│   ║                                                                       ║
│   ║                    BRANCH-MANAGER (business_manager)                  ║
│   ║                      Database Account: business_manager               ║
│   ║                                                                       ║
│   ╚═══════════════════════════════════════════════════════════════════════╝
│
├── BRANCH-MANAGER/
│   │
│   ├── BACKEND-WEB/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── DashboardController.js
│   │   │   ├── StallController.js
│   │   │   ├── FloorSectionController.js
│   │   │   ├── ApplicationController.js
│   │   │   ├── StallholderController.js
│   │   │   ├── EmployeeController.js
│   │   │   ├── PaymentController.js
│   │   │   ├── CollectionController.js
│   │   │   ├── ComplianceController.js
│   │   │   ├── ComplaintController.js
│   │   │   ├── VendorController.js
│   │   │   ├── ReportController.js
│   │   │   └── AuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── StallModel.js
│   │       ├── FloorModel.js
│   │       ├── SectionModel.js
│   │       ├── ApplicationModel.js
│   │       ├── StallholderModel.js
│   │       ├── EmployeeModel.js
│   │       ├── PaymentModel.js
│   │       ├── CollectionModel.js
│   │       ├── ComplianceModel.js
│   │       ├── ComplaintModel.js
│   │       ├── VendorModel.js
│   │       └── ReportModel.js
│   │
│   ├── BACKEND-MOBILE/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── MobileDashboardController.js
│   │   │   ├── MobileStallController.js
│   │   │   ├── MobileEmployeeController.js
│   │   │   ├── MobileCollectionController.js
│   │   │   └── MobileAuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── MobileStallModel.js
│   │       ├── MobileEmployeeModel.js
│   │       ├── MobileCollectionModel.js
│   │       └── MobileSyncModel.js
│   │
│   ├── FRONTEND-WEB/
│   │   │
│   │   └── VIEWS/
│   │       ├── layouts/
│   │       │   ├── BranchManagerLayout.vue
│   │       │   ├── Sidebar.vue
│   │       │   └── Navbar.vue
│   │       ├── pages/
│   │       │   ├── DashboardView.vue
│   │       │   ├── StallManagementView.vue
│   │       │   ├── ApplicantsView.vue
│   │       │   ├── StallholdersView.vue
│   │       │   ├── EmployeesView.vue
│   │       │   ├── PaymentView.vue
│   │       │   ├── CollectorsView.vue
│   │       │   ├── ComplianceView.vue
│   │       │   ├── ComplaintsView.vue
│   │       │   ├── VendorsView.vue
│   │       │   └── ReportsView.vue
│   │       ├── components/
│   │       │   ├── StallGrid.vue
│   │       │   ├── StallCard.vue
│   │       │   ├── StallForm.vue
│   │       │   ├── FloorManager.vue
│   │       │   ├── SectionManager.vue
│   │       │   ├── ApplicantTable.vue
│   │       │   ├── StallholderTable.vue
│   │       │   ├── EmployeeTable.vue
│   │       │   ├── EmployeeForm.vue
│   │       │   ├── CollectorTable.vue
│   │       │   ├── CollectionSummary.vue
│   │       │   ├── PaymentTable.vue
│   │       │   ├── ComplianceTable.vue
│   │       │   ├── ComplaintTable.vue
│   │       │   ├── VendorTable.vue
│   │       │   └── StatisticsCard.vue
│   │       └── modals/
│   │           ├── CreateStallModal.vue
│   │           ├── EditStallModal.vue
│   │           ├── CreateEmployeeModal.vue
│   │           ├── AssignCollectorModal.vue
│   │           ├── CreateComplianceModal.vue
│   │           └── ViewComplaintModal.vue
│   │
│   └── FRONTEND-MOBILE/
│       │
│       └── VIEWS/
│           ├── screens/
│           │   ├── DashboardScreen.js
│           │   ├── StallMonitorScreen.js
│           │   ├── EmployeeTrackerScreen.js
│           │   ├── CollectionScreen.js
│           │   └── NotificationsScreen.js
│           └── components/
│               ├── StallStatusCard.js
│               ├── EmployeeCard.js
│               ├── CollectionWidget.js
│               └── AlertBanner.js
│
│
│   ╔═══════════════════════════════════════════════════════════════════════╗
│   ║                                                                       ║
│   ║                      STALL-HOLDER (credentials)                       ║
│   ║                        Database Account: credentials                  ║
│   ║                                                                       ║
│   ╚═══════════════════════════════════════════════════════════════════════╝
│
├── STALL-HOLDER/
│   │
│   ├── BACKEND-WEB/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── DashboardController.js
│   │   │   ├── StallInfoController.js
│   │   │   ├── PaymentController.js
│   │   │   ├─�� PaymentHistoryController.js
│   │   │   ├── ViolationController.js
│   │   │   ├── ComplaintController.js
│   │   │   ├── NotificationController.js
│   │   │   ├── ProfileController.js
│   │   │   └── AuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── StallHolderModel.js
│   │       ├── StallInfoModel.js
│   │       ├── PaymentModel.js
│   │       ├── PaymentHistoryModel.js
│   │       ├── ViolationModel.js
│   │       ├── ComplaintModel.js
│   │       ├── NotificationModel.js
│   │       └── ProfileModel.js
│   │
│   ├── BACKEND-MOBILE/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── MobileDashboardController.js
│   │   │   ├── MobileStallController.js
│   │   │   ├── MobilePaymentController.js
│   │   │   ├── MobileViolationController.js
│   │   │   ├── MobileComplaintController.js
│   │   │   ├── MobileNotificationController.js
│   │   │   ├── MobileProfileController.js
│   │   │   └── MobileAuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── MobileStallHolderModel.js
│   │       ├── MobilePaymentModel.js
│   │       ├── MobileViolationModel.js
│   │       ├── MobileComplaintModel.js
│   │       ├── MobileNotificationModel.js
│   │       └── MobileSyncModel.js
│   │
│   ├── FRONTEND-WEB/
│   │   │
│   │   └── VIEWS/
│   │       ├── layouts/
│   │       │   ├── StallHolderLayout.vue
│   │       │   ├── Sidebar.vue
│   │       │   └── Navbar.vue
│   │       ├── pages/
│   │       │   ├── DashboardView.vue
│   │       │   ├── MyStallView.vue
│   │       │   ├── PaymentView.vue
│   │       │   ├── PaymentHistoryView.vue
│   │       │   ├── ViolationsView.vue
│   │       │   ├── ComplaintsView.vue
│   │       │   ├── NotificationsView.vue
│   │       │   └── ProfileView.vue
│   │       ├── components/
│   │       │   ├── StallInfoCard.vue
│   │       │   ├── BalanceSummary.vue
│   │       │   ├── PaymentForm.vue
│   │       │   ├── PaymentHistoryTable.vue
│   │       │   ├── ReceiptPreview.vue
│   │       │   ├── ViolationCard.vue
│   │       │   ├── ViolationAppeal.vue
│   │       │   ├── ComplaintForm.vue
│   │       │   ├── ComplaintList.vue
│   │       │   ├── NotificationItem.vue
│   │       │   └── ProfileForm.vue
│   │       └── modals/
│   │           ├── PaymentConfirmModal.vue
│   │           ├── ViewReceiptModal.vue
│   │           ├── AppealViolationModal.vue
│   │           └── SubmitComplaintModal.vue
│   │
│   └── FRONTEND-MOBILE/
│       │
│       └── VIEWS/
│           ├── screens/
│           │   ├── HomeScreen.js
│           │   ├── StallScreen.js
│           │   ├── PaymentScreen.js
│           │   ├── PaymentHistoryScreen.js
│           │   ├── ViolationsScreen.js
│           │   ├── ComplaintsScreen.js
│           │   ├── NotificationsScreen.js
│           │   ├── ProfileScreen.js
│           │   └── SettingsScreen.js
│           └── components/
│               ├── BalanceCard.js
│               ├── QuickPayButton.js
│               ├── PaymentItem.js
│               ├── ViolationAlert.js
│               ├── ComplaintCard.js
│               ├── NotificationBadge.js
│               └── ProfileHeader.js
│
│
│   ╔═══════════════════════════════════════════════════════════════════════╗
│   ║                                                                       ║
│   ║                             APPLICANTS                                ║
│   ║                        Database Account: applicant_user               ║
│   ║                                                                       ║
│   ╚═══════════════════��═══════════════════════════════════════════════════╝
│
├── APPLICANTS/
│   │
│   ├── BACKEND-WEB/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── DashboardController.js
│   │   │   ├── ApplicationController.js
│   │   │   ├── DocumentController.js
│   │   │   ├── StatusController.js
│   │   │   ├── RequirementsController.js
│   │   │   ├── NotificationController.js
│   │   │   ├── ProfileController.js
│   │   │   └── AuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── ApplicantModel.js
│   │       ├── ApplicationModel.js
│   │       ├── DocumentModel.js
│   │       ├── StatusModel.js
│   │       ├── RequirementModel.js
│   │       ├── NotificationModel.js
│   │       └── ProfileModel.js
│   │
│   ├── BACKEND-MOBILE/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── MobileDashboardController.js
│   │   │   ├── MobileApplicationController.js
│   │   │   ├── MobileDocumentController.js
│   │   │   ├── MobileStatusController.js
│   │   │   ├── MobileNotificationController.js
│   │   │   └── MobileAuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── MobileApplicantModel.js
│   │       ├── MobileApplicationModel.js
│   │       ├── MobileDocumentModel.js
│   │       ├── MobileStatusModel.js
│   │       └── MobileSyncModel.js
│   │
│   ├── FRONTEND-WEB/
│   │   │
│   │   └── VIEWS/
│   │       ├── layouts/
│   │       │   ├── ApplicantLayout.vue
│   │       │   └── Navbar.vue
│   │       ├── pages/
│   │       │   ├── LandingPage.vue
│   │       │   ├── ApplicationFormView.vue
│   │       │   ├── DocumentUploadView.vue
│   │       │   ├── StatusTrackingView.vue
│   │       │   ├── RequirementsView.vue
│   │       │   └── ProfileView.vue
│   │       ├── components/
│   │       │   ├── HeroSection.vue
│   │       │   ├── StallShowcase.vue
│   │       │   ├── ApplicationStepper.vue
│   │       │   ├── PersonalInfoForm.vue
│   │       │   ├── BusinessInfoForm.vue
│   │       │   ├── StallSelectionForm.vue
│   │       │   ├── DocumentUploader.vue
│   │       │   ├── DocumentChecklist.vue
│   │       │   ├── StatusTracker.vue
│   │       │   ├── StatusTimeline.vue
│   │       │   ├── RequirementItem.vue
│   │       │   └── ApplicationSummary.vue
│   │       └── modals/
│   │           ├── SubmitApplicationModal.vue
│   │           ├── UploadDocumentModal.vue
│   │           ├── ViewDocumentModal.vue
│   │           └── TermsConditionsModal.vue
│   │
│   └── FRONTEND-MOBILE/
│       │
│       └── VIEWS/
│           ├── screens/
│           │   ├── WelcomeScreen.js
│           │   ├── ApplicationFormScreen.js
│           │   ├── DocumentUploadScreen.js
│           │   ├── StatusTrackingScreen.js
│           │   ├── RequirementsScreen.js
│           │   └── ProfileScreen.js
│           └── components/
│               ├── ApplicationProgress.js
│               ├── DocumentCapture.js
│               ├── StatusBadge.js
│               ├── RequirementCheck.js
│               └── UploadProgress.js
│
│
│   ╔═══════════════════════════════════════════════════════════════════════╗
│   ║                                                                       ║
│   ║              EMPLOYEE (Web Employee, Inspector, Collector)            ║
│   ║                       Database Account: business_employee             ║
│   ║                                                                       ║
│   ╚═══════════════════════════════════════════════════════════════════════╝
│
├── EMPLOYEE/
│   │
│   ├── BACKEND-WEB/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   │
│   │   │   ├── shared/
│   │   │   │   ├── DashboardController.js
│   │   │   │   ├── ProfileController.js
│   │   │   │   ├── NotificationController.js
│   │   │   │   ├── AttendanceController.js
│   │   │   │   └── AuthController.js
│   │   │   │
│   │   │   ├── web-employee/
│   │   │   │   ├── DataEntryController.js
│   │   │   │   ├── RecordController.js
│   │   │   │   ├── ReportController.js
│   │   │   │   └── DocumentController.js
│   │   │   │
│   │   │   ├── inspector/
│   │   │   │   ├── InspectionController.js
│   │   │   │   ├── ViolationController.js
│   │   │   │   ├── ScheduleController.js
│   │   │   │   ├── ComplianceController.js
│   │   │   │   └── EvidenceController.js
│   │   │   │
│   │   │   └── collector/
│   │   │       ├── CollectionController.js
│   │   │       ├── ReceiptController.js
│   │   │       ├── RemittanceController.js
│   │   │       ├── RouteController.js
│   │   │       └── StallholderController.js
│   │   │
│   │   └── MODELS/
│   │       │
│   │       ├── shared/
│   │       │   ├── EmployeeModel.js
│   │       │   ├── ProfileModel.js
│   │       │   ├── NotificationModel.js
│   │       │   └── AttendanceModel.js
│   │       │
│   │       ├── web-employee/
│   │       │   ├── DataEntryModel.js
│   │       │   ├── RecordModel.js
│   │       │   └── DocumentModel.js
│   │       │
│   │       ├── inspector/
│   │       │   ├── InspectionModel.js
│   │       │   ├── ViolationModel.js
│   │       │   ├── ScheduleModel.js
│   │       │   ├── ComplianceModel.js
│   │       │   └── EvidenceModel.js
│   │       │
│   │       └── collector/
│   │           ├── CollectionModel.js
│   │           ├── ReceiptModel.js
│   │           ├── RemittanceModel.js
│   │           ├── RouteModel.js
│   │           └── StallholderModel.js
│   │
│   ├── BACKEND-MOBILE/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   │
│   │   │   ├── shared/
│   │   │   │   ├── MobileDashboardController.js
│   │   │   │   ├── MobileProfileController.js
│   │   │   │   ├── MobileNotificationController.js
│   │   │   │   └── MobileAuthController.js
│   │   │   │
│   │   │   ├── inspector/
│   │   │   │   ├── MobileInspectionController.js
│   │   │   │   ├── MobileViolationController.js
│   │   │   │   ├── MobileScheduleController.js
│   │   │   │   ├── MobileEvidenceController.js
│   │   │   │   └── MobileGeoTagController.js
│   │   │   │
│   │   │   └── collector/
│   │   │       ├── MobileCollectionController.js
│   │   │       ├── MobileReceiptController.js
│   │   │       ├── MobileRemittanceController.js
│   │   │       ├── MobileRouteController.js
│   │   │       └── MobileQRScanController.js
│   │   │
│   │   └── MODELS/
│   │       │
│   │       ├── shared/
│   │       │   ├── MobileEmployeeModel.js
│   │       │   ├── MobileSyncModel.js
│   │       │   └── MobileOfflineModel.js
│   │       │
│   │       ├── inspector/
│   │       │   ├── MobileInspectionModel.js
│   │       │   ├── MobileViolationModel.js
│   │       │   └── MobileEvidenceModel.js
│   │       │
│   │       └── collector/
│   │           ├── MobileCollectionModel.js
│   │           ├── MobileReceiptModel.js
│   │           └── MobileRemittanceModel.js
│   │
│   ├── FRONTEND-WEB/
│   │   │
│   │   └── VIEWS/
│   │       │
│   │       ├── layouts/
│   │       │   ├── EmployeeLayout.vue
│   │       │   ├── Sidebar.vue
│   │       │   └── Navbar.vue
│   │       │
│   │       ├── shared/
│   │       │   ├── pages/
│   │       │   │   ├── DashboardView.vue
│   │       │   │   ├── ProfileView.vue
│   │       │   │   ├── NotificationsView.vue
│   │       │   │   └── AttendanceView.vue
│   │       │   └── components/
│   │       │       ├── ProfileForm.vue
│   │       │       ├── NotificationList.vue
│   │       │       └── AttendanceLog.vue
│   │       │
│   │       ├── web-employee/
│   │       │   ├── pages/
│   │       │   │   ├── DataEntryView.vue
│   │       │   │   ├── RecordManagementView.vue
│   │       │   │   └── ReportView.vue
│   │       │   └── components/
│   │       │       ├── DataEntryForm.vue
│   │       │       ├── RecordTable.vue
│   │       │       └── ReportBuilder.vue
│   │       │
│   │       ├── inspector/
│   │       │   ├── pages/
│   │       │   │   ├── InspectionDashboard.vue
│   │       │   │   ├── InspectionListView.vue
│   │       │   │   ├── InspectionFormView.vue
│   │       │   │   ├── ViolationReportView.vue
│   │       │   │   ├── ScheduleView.vue
│   │       │   │   └── HistoryView.vue
│   │       │   ├── components/
│   │       │   │   ├── InspectionForm.vue
│   │       │   │   ├── InspectionChecklist.vue
│   │       │   │   ├── ViolationForm.vue
│   │       │   │   ├── ViolationList.vue
│   │       │   │   ├── EvidenceUploader.vue
│   │       │   │   ├── ScheduleCalendar.vue
│   │       │   │   └── ComplianceStatus.vue
│   │       │   └── modals/
│   │       │       ├── CreateViolationModal.vue
│   │       │       ├── InspectionDetailModal.vue
│   │       │       └── EvidenceViewModal.vue
│   │       │
│   │       └── collector/
│   │           ├── pages/
│   │           │   ├── CollectorDashboard.vue
│   │           │   ├── CollectionView.vue
│   │           │   ├── ReceiptManagementView.vue
│   │           │   ├── RemittanceView.vue
│   │           │   ├── RouteView.vue
│   │           │   └── HistoryView.vue
│   │           ├── components/
│   │           │   ├── CollectionForm.vue
│   │           │   ├── CollectionList.vue
│   │           │   ├── ReceiptGenerator.vue
│   │           │   ├── ReceiptPreview.vue
│   │           │   ├── RemittanceForm.vue
│   │           │   ├── RemittanceSummary.vue
│   │           │   ├── RouteMap.vue
│   │           │   └── StallholderList.vue
│   │           └── modals/
│   │               ├── ProcessPaymentModal.vue
│   │               ├── PrintReceiptModal.vue
│   │               └── SubmitRemittanceModal.vue
│   │
│   └── FRONTEND-MOBILE/
│       │
│       └── VIEWS/
│           │
│           ├── shared/
│           │   ├── screens/
│           │   │   ├── LoginScreen.js
│           │   │   ├── DashboardScreen.js
│           │   │   ├── ProfileScreen.js
│           │   │   └── NotificationsScreen.js
│           │   └── components/
│           │       ├── BottomNavigation.js
│           │       └── NotificationBadge.js
│           │
│           ├── inspector/
│           │   ├── screens/
│           │   │   ├── InspectorHomeScreen.js
│           │   │   ├── InspectionListScreen.js
│           │   │   ├── InspectionFormScreen.js
│           │   │   ├── ViolationReportScreen.js
│           │   │   ├── ScheduleScreen.js
│           │   │   └── GeoTagScreen.js
│           │   └── components/
│           │       ├── InspectionCard.js
│           │       ├── ChecklistItem.js
│           │       ├── ViolationCapture.js
│           │       ├── PhotoCapture.js
│           │       ├── LocationPicker.js
│           │       └── SignaturePad.js
│           │
│           └── collector/
│               ├── screens/
│               │   ├── CollectorHomeScreen.js
│               │   ├── CollectionScreen.js
│               │   ├── ReceiptScreen.js
│               │   ├── RemittanceScreen.js
│               │   ├── RouteScreen.js
│               │   └── QRScanScreen.js
│               └── components/
│                   ├── CollectionCard.js
│                   ├── PaymentInput.js
│                   ├── ReceiptDisplay.js
│                   ├── QRScanner.js
│                   ├── RouteNavigation.js
│                   └── RemittanceSummary.js
│
│
│   ╔═══════════════════════════════════════════════════════════════════════╗
│   ║                                                                       ║
│   ║                              VENDOR                                   ║
│   ║                         Database Account: vendor_user                 ║
│   ║                                                                       ║
│   ╚═══════════════════════════════════════════════════════════════════════╝
│
├── VENDOR/
│   │
│   ├── BACKEND-WEB/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── DashboardController.js
│   │   │   ├── ProductController.js
│   │   │   ├── InventoryController.js
│   │   │   ├── SalesController.js
│   │   │   ├── OrderController.js
│   │   │   ├── ReportController.js
│   │   │   ├── NotificationController.js
│   │   │   ├── ProfileController.js
│   │   │   └── AuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── VendorModel.js
│   │       ├── ProductModel.js
│   │       ├── InventoryModel.js
│   │       ├── SalesModel.js
│   │       ├── OrderModel.js
│   │       ├── ReportModel.js
│   │       ├── NotificationModel.js
│   │       └── ProfileModel.js
│   │
│   ├── BACKEND-MOBILE/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── MobileDashboardController.js
│   │   │   ├── MobileProductController.js
│   │   │   ├── MobileInventoryController.js
│   │   │   ├── MobileSalesController.js
│   │   │   ├── MobileOrderController.js
│   │   │   ├── MobileNotificationController.js
│   │   │   └── MobileAuthController.js
│   │   │
│   │   └── MODELS/
│   │       ├── MobileVendorModel.js
│   │       ├── MobileProductModel.js
│   │       ├── MobileInventoryModel.js
│   │       ├── MobileSalesModel.js
│   │       ├── MobileOrderModel.js
│   │       └── MobileSyncModel.js
│   │
│   ├── FRONTEND-WEB/
│   │   │
│   │   └── VIEWS/
│   │       ├── layouts/
│   │       │   ├── VendorLayout.vue
│   │       │   ├── Sidebar.vue
│   │       │   └── Navbar.vue
│   │       ├── pages/
│   │       │   ├── DashboardView.vue
│   │       │   ├── ProductManagementView.vue
│   │       │   ├── InventoryView.vue
│   │       │   ├── SalesView.vue
│   │       │   ├── OrdersView.vue
│   │       │   ├── ReportsView.vue
│   │       │   ├── NotificationsView.vue
│   │       │   └── ProfileView.vue
│   │       ├── components/
│   │       │   ├── ProductGrid.vue
│   │       │   ├── ProductCard.vue
│   │       │   ├── ProductForm.vue
│   │       │   ├── InventoryTable.vue
│   │       │   ├── StockAlert.vue
│   │       │   ├── SalesChart.vue
│   │       │   ├── SalesTable.vue
│   │       │   ├── OrderList.vue
│   │       │   ├── OrderDetail.vue
│   │       │   └── ProfileForm.vue
│   │       └── modals/
│   │           ├── AddProductModal.vue
│   │           ├── EditProductModal.vue
│   │           ├── UpdateStockModal.vue
│   │           ├── RecordSaleModal.vue
│   │           └── OrderDetailModal.vue
│   │
│   └── FRONTEND-MOBILE/
│       │
│       └── VIEWS/
│           ├── screens/
│           │   ├── VendorHomeScreen.js
│           │   ├── ProductsScreen.js
│           │   ├── ProductDetailScreen.js
│           │   ├── InventoryScreen.js
│           │   ├── SalesScreen.js
│           │   ├── RecordSaleScreen.js
│           │   ├── OrdersScreen.js
│           │   ├── NotificationsScreen.js
│           │   └── ProfileScreen.js
│           └── components/
│               ├── ProductMiniCard.js
│               ├── InventoryItem.js
│               ├── SalesWidget.js
│               ├── QuickSaleButton.js
│               ├── OrderCard.js
│               ├── StockLevelIndicator.js
│               └── BarcodeScanner.js
│
│
│   ┌─────────────────────────────────────────────────────────────────────┐
│   │                    AUTHENTICATION (SHARED MODULE)                   │
│   └─────────────────────────────────────────────────────────────────────┘
│
├── AUTH/
│   │
│   ├── BACKEND-WEB/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── LoginController.js
│   │   │   ├── RegisterController.js
│   │   │   ├── PasswordController.js
│   │   │   ├── SessionController.js
│   │   │   ├── TokenController.js
│   │   │   └── RoleController.js
│   │   │
│   │   └── MODELS/
│   │       ├── AuthModel.js
│   │       ├── TokenModel.js
│   │       ├── SessionModel.js
│   │       └── PasswordResetModel.js
│   │
│   ├── BACKEND-MOBILE/
│   │   │
│   │   ├── CONTROLLERS/
│   │   │   ├── MobileLoginController.js
│   │   │   ├── MobileRegisterController.js
│   │   │   ├── BiometricAuthController.js
│   │   │   ├── PinAuthController.js
│   │   │   └── TokenRefreshController.js
│   │   │
│   │   └── MODELS/
│   │       ├── MobileAuthModel.js
│   │       ├── BiometricModel.js
│   │       └── MobileTokenModel.js
│   │
│   ├── FRONTEND-WEB/
│   │   │
│   │   └── VIEWS/
│   │       ├── pages/
│   │       │   ├── LoginView.vue
│   │       │   ├── RegisterView.vue
│   │       │   ├── ForgotPasswordView.vue
│   │       │   ├── ResetPasswordView.vue
│   │       │   └── VerifyEmailView.vue
│   │       └── components/
│   │           ├── LoginForm.vue
│   │           ├── RegisterForm.vue
│   │           ├── PasswordResetForm.vue
│   │           └── RoleSelector.vue
│   │
│   └── FRONTEND-MOBILE/
│       │
│       └── VIEWS/
│           ├── screens/
│           │   ├── LoginScreen.js
│           │   ├── RegisterScreen.js
│           │   ├── ForgotPasswordScreen.js
│           │   ├── BiometricSetupScreen.js
│           │   └── PinSetupScreen.js
│           └── components/
│               ├── LoginForm.js
│               ├── BiometricPrompt.js
│               ├── PinInput.js
│               └── RoleSelector.js
│
│
│   ┌─────────────────────────────────────────────────────────────────────┐
│   │                    DOCUMENTATION & UTILITIES                        │
│   └─────────────────────────────────────────────────────────────────────┘
│
├── docs/
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   ├── mvc-explanation.md
│   │   ├── database-design.md
│   │   ├── folder-structure.md
│   │   └── api-design.md
│   ├── api/
│   │   ├── api-documentation.md
│   │   ├── endpoints.md
│   │   └── postman-collection.json
│   ├── user-guides/
│   │   ├── system-administrator-guide.md
│   │   ├── lgu-naga-guide.md
│   │   ├── branch-manager-guide.md
│   │   ├── stall-holder-guide.md
│   │   ├── applicant-guide.md
│   │   ├── employee-guide.md
│   │   └── vendor-guide.md
│   └── diagrams/
│       ├── erd.png
│       ├── use-case-diagram.png
│       ├── class-diagram.png
│       ├── sequence-diagrams/
│       └── flowcharts/
│
├── scripts/
│   ├── setup.sh
│   ├── setup.ps1
│   ├── deploy.sh
│   ├── backup.sh
│   ├── migrate.js
│   ├── seed.js
│   └── generate-docs.js
│
├── tests/
│   ├── unit/
│   │   ├── system-administrator/
│   │   ├── lgu-naga/
│   │   ├── branch-manager/
│   │   ├── stall-holder/
│   │   ├── applicants/
│   │   ├── employee/
│   │   └── vendor/
│   ├── integration/
│   │   ├── api/
│   │   └── database/
│   └── e2e/
│       ├── web/
│       └── mobile/
│
├── uploads/
│   ├── documents/
│   ├── images/
│   ├── receipts/
│   └── temp/
│
└── logs/
    ├── access/
    ├── error/
    └── audit/
