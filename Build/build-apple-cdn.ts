import { parseFelixDnsmasq } from './lib/parse-dnsmasq';
import { task } from './trace';
import { SHARED_DESCRIPTION } from './lib/constants';
import { createMemoizedPromise } from './lib/memo-promise';
import { TTL, deserializeArray, fsFetchCache, serializeArray, createCacheKey } from './lib/cache-filesystem';
import { DomainsetOutput } from './lib/create-file';

const cacheKey = createCacheKey(__filename);

const url = 'https://raw.githubusercontent.com/felixonmars/dnsmasq-china-list/master/apple.china.conf';
export const getAppleCdnDomainsPromise = createMemoizedPromise(() => fsFetchCache.apply(
  cacheKey(url),
  () => parseFelixDnsmasq(url),
  {
    ttl: TTL.THREE_DAYS(),
    serializer: serializeArray,
    deserializer: deserializeArray
  }
));

export const buildAppleCdn = task(require.main === module, __filename)(async (span) => {
  const res: string[] = await span.traceChildPromise('get apple cdn domains', getAppleCdnDomainsPromise());

  return new DomainsetOutput(span, 'apple_cdn')
    .withTitle('Sukka\'s Ruleset - Apple CDN')
    .withDescription([
      ...SHARED_DESCRIPTION,
      '',
      'This file contains Apple\'s domains using their China mainland CDN servers.',
      '',
      'Data from:',
      ' - https://github.com/felixonmars/dnsmasq-china-list'
    ])
    .bulkAddDomainSuffix(res)
    .write();
});
