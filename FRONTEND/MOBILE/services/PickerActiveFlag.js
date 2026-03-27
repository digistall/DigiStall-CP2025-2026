// =============================================
// PICKER ACTIVE FLAG
// =============================================
// A module-level flag used to tell App.js NOT to fire auto-logout
// when the app goes to the background because a file picker
// (camera, gallery, document picker) is currently open.
//
// When the user opens a native picker, Android switches context
// and the app briefly goes to background, which normally triggers
// auto-logout. Setting this flag before opening any picker prevents
// that from happening.
//
// Usage:
//   import PickerActiveFlag from './PickerActiveFlag';
//   PickerActiveFlag.set(true);   // before opening picker
//   ...await picker...
//   PickerActiveFlag.set(false);  // after picker resolves

const PickerActiveFlag = {
  _active: false,

  set(value) {
    this._active = !!value;
  },

  isActive() {
    return this._active;
  },
};

export default PickerActiveFlag;
