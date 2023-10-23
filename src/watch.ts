import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const watch = new k8s.Watch(kc);

export const watchCRDS = async (resourceVersion, onChange) =>
  await watch.watch(
    '/apis/supergraph.operator.cloud/v1/subgraphs',
    {
      resourceVersion,
    },
    onChange,
    (err) =>
      console.log({
        timestamp: Date.now(),
        err,
      }),
  );
