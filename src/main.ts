import { config } from './config';
import { watchCRDS } from './watch';
import server from './term';
const init = async () => {
  const resourceVersion = await config();
  server.listen(9091, () =>
    console.log({
      timestamp: Date.now(),
      msg: 'Health check active on port 9091.',
    }),
  );

  console.log({
    timestamp: Date.now(),
    msg: 'Starting watch over subgraph.supergraph.operator CRDS.',
  });
  await watchCRDS(resourceVersion, (type, obj) => {
    console.log({
      timestamp: Date.now(),
      msg: `Detected change on ${obj.metadata.name}, triggering reconfiguration.`,
    });
    config();
    console.log({ timestamp: Date.now(), msg: 'Reconfigured.' });
  });
};

try {
  init();
} catch (e) {}
