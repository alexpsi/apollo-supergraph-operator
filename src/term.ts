import * as http from 'http';
import { createTerminus } from '@godaddy/terminus';

const onSignal = () => Promise.resolve();
const onShutdown = () => Promise.resolve();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const healthCheck = ({ state }) => {
  // `state.isShuttingDown` (boolean) shows whether the server is shutting down or not
  return Promise.resolve();
};

const server = http.createServer((request, response) => response.end('OK'));

const options = {
  healthChecks: {
    '/healthcheck': healthCheck, // a function accepting a state and returning a promise indicating service health,
    verbatim: true, // [optional = false] use object returned from /healthcheck verbatim in response,
    __unsafeExposeStackTraces: true, // [optional = false] return stack traces in error response if healthchecks throw errors
  },
  onSignal, // [optional] cleanup function, returning a promise (used to be onSigterm)
  onShutdown, // [optional] called right before exiting
};

createTerminus(server, options);

export default server;
