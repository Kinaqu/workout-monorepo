import { Skeleton, configureBoneyard } from 'boneyard-js/react';

import '../../bones/registry.ts';

// Same palette the auth pages configure in auth-shell.jsx; applied once for
// the main app's skeletons.
configureBoneyard({
  color: 'rgba(55, 101, 173, 0.28)',
  darkColor: 'rgba(67, 113, 186, 0.32)',
  animate: 'shimmer',
  shimmerColor: 'rgba(122, 174, 255, 0.34)',
  darkShimmerColor: 'rgba(108, 159, 240, 0.26)',
  speed: '1.85s',
  shimmerAngle: 104,
  transition: 220,
});

export function ShellSkeleton({ name }: { name: string }) {
  return (
    <Skeleton name={name} loading>
      {null}
    </Skeleton>
  );
}
