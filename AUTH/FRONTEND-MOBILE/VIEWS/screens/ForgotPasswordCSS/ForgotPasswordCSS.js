// ===== FORGOT PASSWORD SCREEN - STYLES =====
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // ── Container ────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
  },
  safeArea: {
    flex: 1,
  },

  // ── Header bar ───────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(68, 114, 196, 0.12)',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
  },

  // ── Step progress indicator ───────────────────────────────
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 16,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4472C4',
  },
  stepDotActive: {
    backgroundColor: '#4472C4',
    borderColor: '#4472C4',
  },
  stepDotCompleted: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  stepDotInactive: {
    backgroundColor: '#fff',
    borderColor: '#c5cae9',
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4472C4',
  },
  stepDotTextActive: {
    color: '#fff',
  },
  stepDotTextInactive: {
    color: '#c5cae9',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#c5cae9',
    marginHorizontal: 4,
  },
  stepLineCompleted: {
    backgroundColor: '#27ae60',
  },
  stepLineActive: {
    backgroundColor: '#4472C4',
  },

  // ── Scrollable card ───────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  // ── Step headings ─────────────────────────────────────────
  stepIcon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a237e',
    textAlign: 'center',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#546e7a',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  boldText: {
    fontWeight: '700',
    color: '#1a237e',
  },

  // ── Messages ──────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },

  // ── Input fields ──────────────────────────────────────────
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#37474f',
    marginBottom: 6,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#c5cae9',
    borderRadius: 10,
    backgroundColor: '#fafbff',
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: '#4472C4',
    backgroundColor: '#f0f4ff',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#263238',
  },
  passwordToggle: {
    padding: 4,
  },

  // ── OTP input ─────────────────────────────────────────────
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  otpBox: {
    width: (width - 40 - 52 - 16) / 6, // card padding + spacing
    height: 52,
    borderWidth: 1.5,
    borderColor: '#c5cae9',
    borderRadius: 10,
    backgroundColor: '#fafbff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: '#4472C4',
    backgroundColor: '#f0f4ff',
  },
  otpBoxFilled: {
    borderColor: '#27ae60',
    backgroundColor: '#f1faf3',
  },
  otpText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'center',
  },

  // ── Password strength bar ─────────────────────────────────
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: -8,
  },
  strengthBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },

  // ── Primary action button ─────────────────────────────────
  actionButton: {
    backgroundColor: '#4472C4',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#4472C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonDisabled: {
    backgroundColor: '#9cb0dc',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // ── Resend code row ───────────────────────────────────────
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 13,
    color: '#546e7a',
  },
  resendLink: {
    fontSize: 13,
    color: '#4472C4',
    fontWeight: '700',
    marginLeft: 4,
  },
  resendLinkDisabled: {
    color: '#9e9e9e',
  },

  // ── Success screen (step 4) ───────────────────────────────
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a237e',
    textAlign: 'center',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 15,
    color: '#546e7a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  goToLoginButton: {
    backgroundColor: '#4472C4',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#4472C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  goToLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default styles;
