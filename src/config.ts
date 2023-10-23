import * as k8s from '@kubernetes/client-node';
import * as fs from 'node:fs/promises';
import * as YAML from 'yaml';
import { exec } from 'node:child_process';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sCRD = kc.makeApiClient(k8s.CustomObjectsApi);
const domain = process.env.DOMAIN || 'default';

const composeSuperGraph = () =>
  new Promise((resolve, reject) =>
    exec(
      'rover supergraph compose --elv2-license=accept --insecure-accept-invalid-certs --config ./federation/subgraphs.config.yaml > ./federation/supergraph.graphql',
      (err) => {
        if (err) return reject(err);
        resolve('');
      },
    ),
  );

export const config = async () => {
  console.log({
    timestamp: Date.now(),
    msg: `Retrieving CRDS for ${domain} superGraph domain.`,
  });
  const crds = await k8sCRD.listClusterCustomObject(
    'supergraph.operator.cloud',
    'v1',
    'subgraphs',
  );

  const resourceVersion = crds['body']['metadata']['resourceVersion'];
  const domainCRDS = crds['body']['items'].filter(
    (item) => item.spec.superGraphDomain === domain,
  );

  console.log({
    timestamp: Date.now(),
    msg: `Found ${domainCRDS.length} CRDS for ${domain}.`,
  });

  try {
    await fs.rm('./federation/subgraphs/', { recursive: true });
  } catch (e) {}
  await fs.mkdir('./federation/subgraphs/', { recursive: true });
  console.log({ timestamp: Date.now(), msg: `Cleared configuration.` });

  const subGraphs = await Promise.all(
    domainCRDS.map((crd) => {
      const subgraphName = crd.metadata.name;
      const subgraphGraphQL = crd.spec.graphQLSchema;
      const subgraphAddress = crd.spec.target;
      const subgraphGraphQLPath = `./federation/subgraphs/${subgraphName}.graphql`;
      if (subgraphName && subgraphGraphQL && subgraphAddress) {
        console.log({
          timestamp: Date.now(),
          msg: `Adding subgraph for ${subgraphName} CRD`,
        });
        return fs.writeFile(subgraphGraphQLPath, subgraphGraphQL).then(() => ({
          subgraphName,
          subgraphGraphQLPath: subgraphGraphQLPath.replace('/federation', ''),
          subgraphAddress,
        }));
      }
      return null;
    }),
  );

  const subGraphsConfig = {
    federation_version: 2,
    subgraphs: {},
  };

  subGraphs
    .filter((x) => x)
    .forEach(
      (subGraph) =>
        (subGraphsConfig.subgraphs[subGraph.subgraphName] = {
          routing_url: subGraph.subgraphAddress,
          schema: {
            file: subGraph.subgraphGraphQLPath,
          },
        }),
    );

  await fs.writeFile(
    './federation/subgraphs.config.yaml',
    YAML.stringify(subGraphsConfig),
  );
  console.log({
    timestamp: Date.now(),
    msg: `Created subgraphs.config.yaml`,
    subGraphsConfig,
  });

  await composeSuperGraph();
  console.log({ timestamp: Date.now(), msg: `Composed superGraph.` });

  return resourceVersion;
};
