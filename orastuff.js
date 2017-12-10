function getORADatum(addr, callback){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
		 callback(ORA_transformFields(JSON.parse(this.responseText)));
		}
	};
	xhttp.open("GET", addr, true);
	xhttp.send();
}

ORA_arrayB64 = ["clients"];
ORA_fieldB64 = [];
ORA_listFields = ["state"];
ORA_listValues = [
	["", "waiting", "playing"]
];
ORA_intFields = ["bots", "id", "maxplayers", "spectators", "players"];

ORA_displayFields = {"playersText":
	function(dt){
		return ""+dt.players+" / "+dt.maxplayers+(dt.spectators?(" + " + dt.spectators):"");
	},
	"duration":
	function(dt){
		if(!dt.started)
			return "";
		var diff = Math.abs(makeutc(new Date(dt.started))-new Date().getTime());
		var minutes = Math.floor(diff/1000/60);
		var seconds = Math.floor(diff/1000-minutes*60).toString()
		return minutes+':'+(seconds.length<2?("0"+seconds):seconds);
	},
	"modeDesc":
	function(dt){
		var modeVal = dt.mods.split("@")[0];
		if(modeVal=="ra")
			return "Red Alert";
		if(modeVal=="cnc")
			return "Tiberian Dawn";
		if(modeVal=="d2k")
			return "Dune 2000";
		if(modeVal=="cd")
			return "Crystallized Doom";
		return modeVal;
	},
	"serverLink":
	function(dt){
		var modeid = "openra-"+dt.mods.replace("@","-");
		if(dt.state==1)
			return dt.name+" (<a href='"+modeid+"://"+dt.address+"'>join</a>)";
		return dt.name
	}
};
ORA_resourceCenter = "https://resource.openra.net/map/hash/";
ORA_serverapi = "https://master.openra.net/games_json";
ORA_resourceCenterMapPreview = "https://resource.openra.net/maps/";
ORA_unknownmap = {
	title:"unknown map",
	author:"unknown"
}

ORA_maplist = {
	
};

ORA_datumCounter = {
	cnt:0,
	callback: function(){},
	add: function(){
		this.cnt++;
	},	
	remove: function(){
		this.cnt--;
		if(this.callback && this.cnt==0)
			this.callback();
	}
}

function ResourceCenter(addr, hash, callback){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
		 callback(JSON.parse(this.responseText)[0]);
		}
		else if (this.readyState == 4){
			callback(ORA_unknownmap);
		}
	};
	xhttp.open("GET", addr+hash, true);
	xhttp.send();
}

function ORA_insertMap(datum, callback){
	ORA_datumCounter.callback = function(){
		callback(datum);
	};
	ORA_datumCounter.add();
	for(var i=0; i<datum.length; i++){
		ORA_datumCounter.add();
		if(ORA_maplist[datum[i].map]){
			datum[i].map = ORA_maplist[datum[i].map];
			if(datum[i].map.url && datum[i].map.id)
				datum[i].mapLink = datum[i].map.title+"<br/>(<a href='"+ORA_resourceCenterMapPreview + datum[i].map.id.toString()+"'>link</a>)"+"<br/>(<a href='"+datum[i].map.url+"'>download</a>)";
			else datum[i].mapLink = datum[i].map.title;
			ORA_datumCounter.remove();
		}
		else
			ResourceCenter(
				ORA_resourceCenter,
				datum[i].map,
				function(dt){
					return function(mapinfo){
						var mapid = dt.map;
						dt.map = {
							title: mapinfo.title,
							author: mapinfo.author,
							viewed: mapinfo.viewed,
							downloaded: mapinfo.downloaded,
							players: mapinfo.players,
							infotext: mapinfo.info,
							rules: mapinfo.rules?atob(mapinfo.rules):null,
							url: mapinfo.url,
							id: mapinfo.id
						};
						if(dt.map.url && dt.map.id)
							dt.mapLink = dt.map.title+"<br/>(<a href='"+ORA_resourceCenterMapPreview + dt.map.id.toString()+"'>link</a>)"+"<br/>(<a href='"+dt.map.url+"'>download</a>)";
						else dt.mapLink = dt.map.title;
						ORA_maplist[mapid] = dt.map;
						ORA_datumCounter.remove();
					}
				}(datum[i])
			)
	}
	ORA_datumCounter.remove();
}

function utf8_to_str(utftext){
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while ( i < utftext.length ) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
	
function makeutc(date){
	return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
}

function ORA_transformFields(datum){
	for(var i=0; i<datum.length; i++){
		for(var k=0; k<ORA_fieldB64.length; k++){
			var fieldname = ORA_fieldB64[k];
			if(!datum[i][fieldname]) continue;
			datum[i][fieldname] = utf8_to_str(atob(datum[i][fieldname]));
		}
		for(var k=0; k<ORA_arrayB64.length; k++){
			var fieldname = ORA_arrayB64[k];
			if(!datum[i][fieldname]) continue;
			for(var q=0; q< datum[i][fieldname].length; q++)
				datum[i][fieldname][q] = utf8_to_str(atob(datum[i][fieldname][q]));
		}
		for(var k=0; k<ORA_intFields.length; k++){
			var fieldname = ORA_intFields[k];
			if(!datum[i][fieldname]) continue;
			datum[i][fieldname] = +datum[i][fieldname];
		}
		for(var k=0; k<ORA_listFields.length; k++){
			var fieldname = ORA_listFields[k];
			if(!datum[i][fieldname]) continue;
			datum[i][fieldname+'Text'] = ORA_listValues[k][+datum[i][fieldname]];
		}
		for(var fld in ORA_displayFields){
			datum[i][fld]=ORA_displayFields[fld](datum[i]);
		}
		
	}
	return datum;
}



function ORA_easyfilter(datum, fieldName, fieldValue){
	return datum.filter(function(dt){ return dt[fieldName]==fieldValue});
}

function ORA_filterStandard(dt){return +dt.state==1 && dt.players>0 && dt.maxplayers>dt.players}

function ORA_filterHasPlayers(dt){return dt.players>0}

function ORA_filterCurrentlyPlayed(dt){return +dt.state==2}

function ORA_filterLookForMap(map){
	return function(dt){
		return dt.map&&dt.map.title&&dt.map.title.toLowerCase().indexOf(map) != -1;
	}
}

function ORA_filterLookForServer(server){
	return function(dt){
		return dt.name&&dt.name.toLowerCase().indexOf(server) != -1;
	}
}

function ORA_filterLookForMode(mode){
	return function(dt){
		return  dt.mods&& dt.mods.toLowerCase().indexOf(mode) != -1;
	}
}

function ORA_filterLookForPlayer(player){
	return function(dt){
		if(!dt.clients)
			return false;
		for(var i=0; i<dt.clients.length; i++)
			if(dt.clients[i].toLowerCase().indexOf(player)!=-1)
				return true;
		return false;
	}
}

function ORA_filterLookForPlayerList(players){
	return function(dt){
		if(!dt.clients)
			return false;
		for(var i=0; i<dt.clients.length; i++){
			for(var k=0; k<players.length; k++){
				if(dt.clients[i].toLowerCase().indexOf(players[k].toLowerCase())!=-1)
					return true;
			}
		}
		return false;
	}
}

function ORA_filterCompetitive(dt){return +dt.state==1 && dt.players>0 && dt.maxplayers==2}

function ORA_filterRedAlert(dt){return +dt.state==1 && dt.players>0 && dt.mods.split("@")[0]=="ra"}

function ORA_niceString(elmt){
	return elmt.mods.split("@")[0] + ": " + elmt.name.replace("!","") + " ("+elmt.players+"/"+elmt.maxplayers+(elmt.spectators>0?"+"+ elmt.spectators:"")+")";
}

function concat_F(){
	var par = arguments;
	return function(x){
		var value = x;
		for(var i=0; i<par.length; i++)
			value = par[i](value);
		return value;
	}
}

function and_F(){
	var par = arguments;
	return function(x){
		for(var i=0; i<par.length; i++)
			if(!par[i](x))
				return false;
		return true;
	}
}

function or_F(){
	var par = arguments;
	return function(x){
		for(var i=0; i<par.length; i++)
			if(par[i](x))
				return true;
		return false;
	}
}


function ORA_prepData(filter, callback){
	getORADatum(ORA_serverapi, function(datum){
		var dat = datum.filter(filter)||[];
		ORA_insertMap(dat,callback);
	});
}

function ORA_niceString_Lambda(filter){
	return function(datum){
		var result = filter?datum.filter(filter):datum;
		for(var i=0; i<result.length;i++)
			result[i] = ORA_niceString(result[i]);
		return result;
	}
}