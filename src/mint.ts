import { createWalletClient, encodeFunctionData, webSocket } from 'viem'
import { optimismGoerli } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts' 
import { sbt_verifier } from './verifier/index'
import { randomAsU8a } from "@zcloak/crypto";
import { u8aToHex, hexToU8a } from "@polkadot/util"
import { wagmiAbi } from './abi'

const client = createWalletClient({
  chain: optimismGoerli,
  transport: webSocket('wss://opt-goerli.g.alchemy.com/v2/H91sFaLoYh4VwBsHajIRRpOSc1CKawJm')
})

const account = privateKeyToAccount('0x') 


async function main() {

  const recipient = '0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1';
  const ctype = '0x5f0d91707ce8e3e252f433b9d6c611fa8851c99c6f359f5b604cd0b8c8d355a7';
  const programHash = u8aToHex(randomAsU8a(32));
  const digest = '0xd33faa6964e347b6b5ac5c79184d2c214132214bab6c0c425bd544d8109d09b3';
  const verifier = '0xC2BADDbf6DCeDA9b68638a9de84063c1E0ee4350';
  const attester =  '0xFeDE01Ff4402e35c6f6d20De9821d64bDF4Ba563';
  const attesterSignature = '0xaa3cfa08e920ecf02d3238240e4d5646131830a852378bc5aed79db9fb6a5f9d6b3e8ccac3c77e32f532372b8277536e91c8b527af086996889cd1080a144abc01';
  const output = [
    '13682078803786719864', '17202764081818277337',
    '17367760472180409902', '18182358865673556573',
    '1',                    '0',
    '0',                    '0',
    '0',                    '0',
    '0',                    '0',
    '0',                    '0',
    '0',                    '0',
    '0',                    '0',
    '0',                    '0',
    '0'
  ] as any;
  const issuanceTimestamp = 1683918662477 as any;
  const expirationTimestamp = 0 as any;
  const vcVersion = '0x0001';
  const [signature, sbtLink] = await sbt_verifier(programHash);
  const signatureHex = u8aToHex(signature);
  


  const data = encodeFunctionData({
    abi: wagmiAbi,
    functionName: 'mint',
    args: [{recipient, ctype,programHash,digest,verifier,attester,attesterSignature, output, issuanceTimestamp, expirationTimestamp, vcVersion, sbtLink}, signatureHex]
  })

  const hash = await client.sendTransaction({
    data: data, 
    account,
    to: '0x398072c9a703C783becCd2b289e1Fa6D3DC35Aa5',
    value: 0n
  })

}

main();