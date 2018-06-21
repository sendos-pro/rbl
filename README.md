# sendos-tools-dnsbl

```
npm i sendos-tools-dnsbl
```

## Usage

``` js
var lookup = require('sendos-tools-dnsbl');

var dnsbl = new lookupRbl.dnsbl('127.0.0.2', myrblList, ["127.0.0.1:10053"]);
var resultRbl = [];

dnsbl.on('error',function(error, blocklist) { console.log(error) });

dnsbl.on('data',function(result, blocklist) {
    resultRbl.push(result);
});

dnsbl.on('done', function() {
  console.log(resultRbl);
});
```