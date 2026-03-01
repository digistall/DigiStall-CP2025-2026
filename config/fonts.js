/**
 * Font Configuration for React Native
 * Use these constants throughout the app for consistent typography
 */

export const Fonts = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  light: 'Poppins-Light',
};

/**
 * Typography styles to use throughout the app
 */
export const Typography = {
  // Headings
  h1: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontFamily: Fonts.semiBold,
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  h5: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    lineHeight: 26,
  },
  h6: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },

  // Body text
  body1: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },

  // Captions and labels
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },

  // Buttons
  button: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  buttonSmall: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },

  // Special
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  overline: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
};

export default { Fonts, Typography };


