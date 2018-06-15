## DNSBLs Lookup (Node.js)
Supports IPv4, IPv6 and Domain lookup. Works from command-line.
## Installation
##### Global
```javascript
npm i sendos-lookup -g
```    
##### Local
```javascript
npm i sendos-lookup --save
const lookup = require('sendos-lookup');
```     
## Usage

##### dnsbl(ip-or-domain,[dnsbl_list],[limit])
Performs DNSBL lookup on the given IP address. If a domain is provided, lookup is performed on it's 'A' records. 

 * `ip-or-domain`: String containing IPv4, IPv6 or domain names
 * `dnsbl_list`: Optional, Array of DNSBL zone names
 * `limit`: Optional, Maximum number of outstanding DNS queries at a time. Defaults to 200.

##### Example:

```javascript
var dnsbl = new lookup.dnsbl('58.97.142.25');

dnsbl.on('error',function(error,blocklist){ ... });
dnsbl.on('data',function(result,blocklist){
  console.log(result.status + ' in ' + blocklist.zone);
});
dnsbl.on('done', function(){ 
  console.log('lookup finished');
});  
```

#####  uribl(domains,[uribl_list],limit)
Performs a URI DNSBL query on the give domain(s). 

 * `domains`: String or Array of domain names
 * `uribl_list`: Optional, Array of URI DNSBL zone names
 * `limit`: Optional, Maximum number of outstanding DNS queries at a time. Defaults to 200.

##### Example:

```javascript
var uribl= new lookup.uribl('gmail.com');

uribl.on('error',function(error,blocklist){ ... });
uribl.on('data',function(result,blocklist){ ... });
uribl.on('done', function(){ ... });  
```

_see more examples in test.js_

### Response:
 * `blName`: lookup address
 * `blHostName`: listed / not_listed
 * `blAddress`: listed / not_listed
 * `blListing`: 'A' record lookup result only when listed
 * `blMessage`: 'TXT' record lookup result if found
 * `blActive`: 'TXT' record lookup result if found
 * `blQueryTime`: 'TXT' record lookup result if found

```javascript  
{
    "blName": "Spamhaus ZEN",
    "blHostName": "zen.spamhaus.org",
    "blAddress": "127.0.0.2"
    "blListing": true,
    "blMessage": "https://www.spamhaus.org/query/ip/127.0.0.2\nhttps://www.spamhaus.org/sbl/query/SBL2",
    "blActive": true,
    "blQueryTime": 576,
}
```

### Command-line:

```bash     
$ dnsbl-lookup 58.97.142.25
$ dnsbl-lookup 2a01:4f8:140:4222::2
$ dnsbl-lookup gmail.com list.txt // list.txt is line-separated dns zones 
```