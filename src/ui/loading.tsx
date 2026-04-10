import { cn } from '../lib/utils';
import { Spinner } from './spinner';

type LoadingProps = {
  height?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
};

export const Loading = ({ height = '100vh', className, size = 'md' }: LoadingProps) => {
  return (
    <div className={cn('flex items-center justify-center', className)} style={{ height }}>
      <Spinner className={cn('text-primary', sizeMap[size])} />
    </div>
  );
};
