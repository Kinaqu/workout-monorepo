import { snapshotBones } from 'boneyard-js';

if (typeof window !== 'undefined' && window.__BONEYARD_BUILD) {
  window.__BONEYARD_SNAPSHOT = snapshotBones;
}
