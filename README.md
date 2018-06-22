# sendos-tools-dnsbl

```
npm i sendos-tools-dnsbl
```

## Usage

``` js
const lookup = require('sendos-tools-dnsbl');

let dnsbl = new lookup.check('yandex.ru', false, ["127.0.0.1:10053"]); // check, dnsbl, uribl
let resultRbl = [];
 
dnsbl.on('error',function(error, blocklist) { console.log(error) });
 
dnsbl.on('data',function(result, blocklist) {
    resultRbl.push(result);
});
 
dnsbl.on('done', function() {
  console.log(resultRbl);
});
```