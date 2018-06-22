"use strict";

var LIMIT = 200,
  async = require('async'), 
  dns = require('dns'),
  util = require('util'),
  net = require('net'),
  events = require("events"),
  blist = require('./list/blist.json');


function getList(type) {

  let list = [] 

  blist.forEach(function(item, i, arr) {
    if(arr.ipv4 == type) {
      list.push(arr);
    }
  }); 

  return list

}



function expandIPv6Address(address)
{
    var fullAddress = "";
    var expandedAddress = "";
    var validGroupCount = 8;
    var validGroupSize = 4;
 
    var ipv4 = "";
    var extractIpv4 = /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/;
    var validateIpv4 = /((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})/;
 
    // look for embedded ipv4
    if(validateIpv4.test(address))
    {
        groups = address.match(extractIpv4);
        for(var i=1; i<groups.length; i++)
        {
            ipv4 += ("00" + (parseInt(groups[i], 10).toString(16)) ).slice(-2) + ( i==2 ? ":" : "" );
        }
        address = address.replace(extractIpv4, ipv4);
    }
 
    if(address.indexOf("::") == -1) // All eight groups are present.
        fullAddress = address;
    else // Consecutive groups of zeroes have been collapsed with "::".
    {
        var sides = address.split("::");
        var groupsPresent = 0;
        for(var i=0; i<sides.length; i++)
        {
            groupsPresent += sides[i].split(":").length;
        }
        fullAddress += sides[0] + ":";
        for(var i=0; i<validGroupCount-groupsPresent; i++)
        {
            fullAddress += "0000:";
        }
        fullAddress += sides[1];
    }
    var groups = fullAddress.split(":");
    for(var i=0; i<validGroupCount; i++)
    {
        while(groups[i].length < validGroupSize)
        {
            groups[i] = "0" + groups[i];
        }
        expandedAddress += (i!=validGroupCount-1) ? groups[i] + ":" : groups[i];
    }
    return expandedAddress;
}

function reverseIP(address) {
  if(net.isIPv4(address)){
    address = address.split('.').reverse().join('.');
  }
  else if(net.isIPv6(address)){
    address = expandIPv6Address(address);
    address = address.split(/:|/).reverse().join('.');  
  }
  return address;
}

function do_a_lookup(query, address, zoneUrl, zoneName, callback) {

  var start = new Date().getTime();

  dns.resolve(query,function(err,addresses) {

    var finish = new Date().getTime() - start;

    if (err) {
      if(err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
        return callback(
          null,
          {"blName": zoneName,
          "blHostName": zoneUrl,
          "blAddress": address,
          "blListing": false,
          "blMessage": false,
          "blWorking": true,
          "blQueryTime": finish}
        );
      } else {
        return callback(
          null,
          {"blName": zoneName,
          "blHostName": zoneUrl,
          "blAddress": address,
          "blListing": false,
          "blMessage": false,
          "blWorking": false,
          "blQueryTime": finish}
          );
      }          
    }

    if(addresses) {

      dns.resolveTxt(query,function(err, records) {

        if(err) return callback(err);

        finish = new Date().getTime() - start;
        
        if(records) {
          return callback(
            null,
            {"blName": zoneName,
            "blHostName": zoneUrl,
            "blAddress": address,
            "blListing": true,
            "blMessage": records.join("\n") || false,
            "blWorking": true,
            "blQueryTime": finish}
            );
        }

      });          
    }   

  });

}

function multi_lookup(addresses, dnsList, list, limit) {
  var root = this;  
  addresses = Array.isArray(addresses)?addresses: [addresses];  
  limit = limit || LIMIT;
  
  dns.setServers(
    dnsList || ['8.8.8.8']
  );

  async.eachSeries(addresses,function(address,callback_a){
    var lookup_address = reverseIP(address);    
    async.eachLimit(list,limit,function(item,callback_b){      
      var zoneUrl = item.url || item,
          zoneName = item.name || item,
          query = lookup_address+ '.'+zoneUrl; 

      do_a_lookup(query, address, zoneUrl, zoneName, function(err,res){
        if(err)
          root.emit('error',err,item);
        else{   
          root.emit('data',res,item);
        }        
        callback_b();
      });
    },function(err){
      if(err) throw err;
      callback_a(err);      
    });
  },function(err){
    if(err) throw err;
    root.emit('done');
  });
}

function dnsbl(ip_or_domain,list,limit){ 
  var root = this; 

  if(net.isIPv4(ip_or_domain)){    
    list = list || getList('ipv4');
    multi_lookup.call(this,ip_or_domain,list,limit);
  }  
  else if(net.isIPv6(ip_or_domain)){    
    list = list || getList('ipv6');
    multi_lookup.call(this,ip_or_domain,list,limit);
  }
  else{
    dns.resolve(ip_or_domain,function(err,addresses){        
      if(err){
        root.emit('error',err);
        root.emit('done');
      }
      else if(addresses){
        list = list || blist;
        multi_lookup.call(root,addresses,list,limit);
      }
      else {

      }
    });
  }  
  events.EventEmitter.call(this);
}

function uribl(domain,list,limit){
  list = list || getList('domain');  
  multi_lookup.call(this,domain,list,limit);
  events.EventEmitter.call(this);
};

util.inherits(dnsbl, events.EventEmitter);
util.inherits(uribl,events.EventEmitter);
exports.dnsbl = dnsbl;
exports.uribl = uribl;
exports.reverseIP = reverseIP;
