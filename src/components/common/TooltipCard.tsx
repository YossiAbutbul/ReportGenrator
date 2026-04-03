import type { CSSProperties, ReactElement, ReactNode } from 'react';

type TooltipCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function TooltipCard({
  children,
  className = '',
  style,
}: TooltipCardProps): ReactElement {
  const classes = ['tooltip-card', className].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
