import { typography, colors } from '../../styles/index.js';

function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  size = 'medium',
  type = 'button',
  style = {}
}) {
  const baseStyle = {
    ...typography.button,
    padding: size === 'small' ? '8px 16px' : size === 'large' ? '20px 40px' : '16px 32px',
    borderRadius: '12px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    textAlign: 'center',
  };

  const variants = {
    primary: {
      backgroundColor: colors.primary[600],
      color: colors.white,
    },
    secondary: {
      backgroundColor: colors.white,
      color: colors.primary[600],
      border: `2px solid ${colors.primary[200]}`,
    },
    success: {
      backgroundColor: colors.success[600],
      color: colors.white,
    },
    danger: {
      backgroundColor: colors.danger[600],
      color: colors.white,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.neutral[700],
      border: `1px solid ${colors.neutral[300]}`,
    },
  };

  return (
    <button
      type={type}
      style={{ ...baseStyle, ...variants[variant], ...style }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
