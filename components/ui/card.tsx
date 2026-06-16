import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export function Card({ elevated, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#262626] transition-all duration-200',
        elevated ? 'bg-[#171717]' : 'bg-[#111111]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between p-4 pb-0', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center p-4 pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-[#f5f5f5]', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-[#737373]', className)} {...props}>
      {children}
    </p>
  )
}
