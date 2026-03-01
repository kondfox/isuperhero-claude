import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'default' | 'large'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

export function Button({
  variant = 'primary',
  size = 'default',
  asChild = false,
  className,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  const classNames = [
    styles.button,
    styles[variant],
    size === 'large' ? styles.large : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return <Component className={classNames} {...props} />
}
