const LOCALHOST = "http://localhost:8899";
const WSLOCALHOST = "ws://localhost:8900/";

module.exports = {
  validator: {
    killRunningValidators: true,
    programs: [
      { 
        label: 'Token Metadata Program',
        programId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        deployPath: localDeployPath('mpl_token_metadata')
      },
/*      { 
        label: 'IMSO Claim Program',
        programId: "7HXG93N6ino2vUfa3qb9suTbGq7ts7o1pdTs27ayP9pw",
        deployPath: localDeployPath('imso-claim')
      },
    */    ],
    jsonRpcUrl: LOCALHOST,
    websocketUrl: '',
    commitment: 'confirmed',
    ledgerDir: 'tmpLedgerDir()',
    resetLedger: true,
    verifyFees: false,
    detached: true,//process.env.CI != null,
  },
  relay: {
    enabled: process.env.CI == null,
    killlRunningRelay: true,
  },
  storage: {
    enabled: process.env.CI == null,
    storageId: 'mock-storage',
    clearOnStart: true,
  },
}

function localDeployPath(program) {
  switch(program) {
    case 'mpl_token_metadata':
      return "../metaplex-program-library/token-metadata/target/deploy/mpl_token_metadata.so";
/*    case 'imso-claim':
      return "target/deploy/imso_claim.so";
*/    default:
      throw new Error(`Unknown program ${program}`);
  }
}