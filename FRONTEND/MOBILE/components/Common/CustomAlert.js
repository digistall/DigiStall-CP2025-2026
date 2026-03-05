import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * CustomAlert - A beautiful, reusable alert/popup component
 * Replaces native Alert.alert with a styled modal that blends with the app.
 *
 * USAGE:
 * 1. Add state:  const [alert, setAlert] = useState({ visible: false });
 *
 * 2. Place in JSX:
 *    <CustomAlert
 *      visible={alert.visible}
 *      type={alert.type}          // 'success' | 'error' | 'warning' | 'info' | 'confirm'
 *      title={alert.title}
 *      message={alert.message}
 *      buttons={alert.buttons}    // optional custom buttons
 *      onClose={() => setAlert({ visible: false })}
 *    />
 *
 * 3. Show alert:
 *    setAlert({ visible: true, type: 'success', title: 'Done!', message: 'Saved successfully.' });
 *
 * 4. Confirmation dialog:
 *    setAlert({
 *      visible: true, type: 'confirm', title: 'Delete?', message: 'This cannot be undone.',
 *      buttons: [
 *        { text: 'Cancel', style: 'cancel' },
 *        { text: 'Delete', style: 'destructive', onPress: handleDelete },
 *      ]
 *    });
 *
 * Props:
 *  - visible (bool)        : show/hide the modal
 *  - type (string)         : 'success' | 'error' | 'warning' | 'info' | 'confirm'
 *  - title (string)        : alert title
 *  - message (string)      : alert message body
 *  - buttons (array)       : custom buttons [{ text, onPress, style }]
 *                            style: 'default' | 'cancel' | 'destructive'
 *  - onClose (func)        : called when alert is dismissed
 *  - autoClose (number)    : auto-close after ms (0 = disabled, default for success/error)
 */

const TYPE_CONFIG = {
  success: {
    icon: '✓',
    iconBg: '#10B981',
    accentColor: '#10B981',
    title: 'Success',
  },
  error: {
    icon: '✕',
    iconBg: '#EF4444',
    accentColor: '#EF4444',
    title: 'Error',
  },
  warning: {
    icon: '!',
    iconBg: '#F59E0B',
    accentColor: '#F59E0B',
    title: 'Warning',
  },
  info: {
    icon: 'i',
    iconBg: '#002181',
    accentColor: '#002181',
    title: 'Info',
  },
  confirm: {
    icon: '?',
    iconBg: '#002181',
    accentColor: '#002181',
    title: 'Confirm',
  },
};

const CustomAlert = ({
  visible = false,
  type = 'info',
  title,
  message,
  buttons,
  onClose,
  autoClose = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      iconBounce.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon bounce
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(iconBounce, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-close
      if (autoClose > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoClose);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleClose = (callback) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
      if (onClose) onClose();
    });
  };

  const handleButtonPress = (button) => {
    if (button.style === 'cancel') {
      handleClose();
    } else {
      handleClose(button.onPress);
    }
  };

  const getButtons = () => {
    if (buttons && buttons.length > 0) return buttons;
    // Default single OK button
    return [{ text: 'OK', style: 'default' }];
  };

  const renderButton = (button, index, totalButtons) => {
    const isCancel = button.style === 'cancel';
    const isDestructive = button.style === 'destructive';
    const isSingleButton = totalButtons === 1;

    let buttonStyle = [styles.button];
    let textStyle = [styles.buttonText];

    if (isSingleButton) {
      buttonStyle.push(styles.buttonFull);
      buttonStyle.push({ backgroundColor: config.accentColor });
      textStyle.push({ color: '#FFFFFF' });
    } else if (isCancel) {
      buttonStyle.push(styles.buttonOutline);
      buttonStyle.push({ borderColor: '#D1D5DB' });
      textStyle.push({ color: '#6B7280' });
    } else if (isDestructive) {
      buttonStyle.push({ backgroundColor: '#EF4444' });
      textStyle.push({ color: '#FFFFFF' });
    } else {
      buttonStyle.push({ backgroundColor: config.accentColor });
      textStyle.push({ color: '#FFFFFF' });
    }

    return (
      <TouchableOpacity
        key={index}
        style={buttonStyle}
        onPress={() => handleButtonPress(button)}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{button.text}</Text>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  const alertButtons = getButtons();

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top accent line */}
          <View style={[styles.accentLine, { backgroundColor: config.accentColor }]} />

          {/* Icon circle */}
          <Animated.View
            style={[
              styles.iconCircle,
              {
                backgroundColor: config.iconBg,
                transform: [
                  {
                    scale: iconBounce.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.iconText}>{config.icon}</Text>
          </Animated.View>

          {/* Title */}
          <Text style={styles.titleText}>{title || config.title}</Text>

          {/* Message */}
          {message ? (
            <Text style={styles.messageText}>{message}</Text>
          ) : null}

          {/* Buttons */}
          <View
            style={[
              styles.buttonRow,
              alertButtons.length === 1 && styles.buttonRowSingle,
            ]}
          >
            {alertButtons.map((btn, i) => renderButton(btn, i, alertButtons.length))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  alertContainer: {
    width: Math.min(SCREEN_WIDTH - 60, 340),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 0,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  accentLine: {
    width: '120%',
    height: 4,
    marginBottom: 24,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  iconText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonFull: {
    flex: 1,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

/**
 * Helper hook for easy alert state management
 * 
 * Usage:
 *   import { useCustomAlert } from '../components/Common/CustomAlert';
 *   
 *   const { alert, showAlert, hideAlert, AlertComponent } = useCustomAlert();
 *   
 *   // Show simple alert:
 *   showAlert('success', 'Done!', 'Profile updated.');
 *   
 *   // Show confirmation:
 *   showAlert('confirm', 'Delete?', 'Are you sure?', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Delete', style: 'destructive', onPress: handleDelete },
 *   ]);
 * 
 *   // In JSX:
 *   return <>{...}<AlertComponent /></>;
 */
export const useCustomAlert = () => {
  const [alertState, setAlertState] = React.useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
    autoClose: 0,
  });

  const showAlert = (type, title, message, buttons, autoClose = 0) => {
    setAlertState({ visible: true, type, title, message, buttons, autoClose });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      visible={alertState.visible}
      type={alertState.type}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      autoClose={alertState.autoClose}
      onClose={hideAlert}
    />
  );

  return { alert: alertState, showAlert, hideAlert, AlertComponent };
};

export default CustomAlert;
