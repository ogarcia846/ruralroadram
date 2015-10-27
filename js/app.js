 var states={};
     states[Connection.UNKNOWN] = "Unknown";
     states[Connection.ETHERNET] = "Ethernet";
     states[Connection.WIFI] = "Wi-Fi";
     states[Connection.CELL_2G] = "Cell 2G";
     states[Connection.CELL_3G] = "Cell 3G";
     states[Connection.CELL_4G] = "Cell 4G";
     states[Connection.NONE] = "No Network";

//special global variables; 

    var gid = 6; //this uses group2 fro m ruralram_v2
    var county = "Napa"; //this uses Santa Cruz   
    $('#groupID').text("Group #"+gid).removeClass("subTxtFntOff").addClass("subTxtFntOn");
    $('#countyTbl').text("County: "+county).removeClass("subTxtFntOff").addClass("subTxtFntOn");
    var resultUsersJSON;
    var resultShedsJSON;
    var resultSitesJSON;
    var resultHistoryJSON;
    var dbCon;
    var sqlStr;
    localStorage.setItem("siteCount",0);
    
 document.addEventListener('deviceready', onDeviceReady, false);
 function onDeviceReady(){
    //set selclick class


    var onLine=true;
    document.addEventListener("online",isOnLine,false);
    document.addEventListener("offline",isOffLine,false);

    var locOptions = {timeout: 5000, enableHighAccuracy : true };
    navigator.geolocation.getCurrentPosition(onGeoLocationSuccess, onGeoLocationError,locOptions); 
    


 	//Cordova is ready, open database
    dbCon = window.openDatabase("rrDB", "1.0", "Ram DB",1000000);
    countUserRows(function(num){
       $('#usrTbl').text("# Users :"+num).removeClass("subTxtFntOff").addClass("subTxtFntOn");

    });
    countSubshedRows(function(num){
       $('#ssTbl').text("# Subwatersheds :"+num).removeClass("subTxtFntOff").addClass("subTxtFntOn");

    });
    countSitesRows(function(num){
       $('#sitesTbl').text("# Sites :"+num).removeClass("subTxtFntOff").addClass("subTxtFntOn");
       $("#totRecs").val(num);
       localStorage.setItem("siteCount",num);

    });
    countHistoryRows(function(num){
       $('#historyTbl').text("# History Recs:"+num).removeClass("subTxtFntOff").addClass("subTxtFntOn");

    });


    if(onLine){
       var usersURL = "http://www.tahoeroadram.com/ruralram_v2/app/app_Users_v2.php";
                $.ajax({ 
                  url: usersURL,
                  type: 'GET',
                  data: {gid: '6'}
                   })
                    .done(function(response){
                    resultUsersJSON=response;
                    insertUsers();
                    }); 
       var subshedURL = "http://www.tahoeroadram.com/ruralram_v2/app/app_getSubsheds_v2.php";            
                $.ajax({ 
                  url: subshedURL,
                  type: 'GET',
                  data: {gid: '6', county: 'Napa'}
                   })
                    .done(function(response){
                    resultShedsJSON=response;
                    insertSubsheds();
                    }); 
       var subsiteURL = "http://www.tahoeroadram.com/ruralram_v2/app/app_Sites_v2.php";            
                $.ajax({ 
                  url: subsiteURL,
                  type: 'GET',
                  data: {gid: '6'}
                   })
                    .done(function(response){
                    resultSitesJSON=response;
                    insertSites();
                    }); 
       var historyURL = "http://www.tahoeroadram.com/ruralram_v2/app/app_ObsHistory_v2.php";            
                $.ajax({ 
                  url: historyURL,
                  type: 'GET',
                  data: {gid: '6'}
                   })
                    .done(function(response){                     
                    resultHistoryJSON=response;                    
                    insertHistory();
                    });                                  
         
    }
    //onclick in sites page set the id clicked
    $(document).on("pagecreate","#subWatershedList",function(){
        $(".data").on("click",function(){
            $.mobile.pageContainer.pagecontainer("change","#sitesPage", {
                siteid: this.id,
                transition: "flip"
            });
            sessionStorage.setItem('lastSite',this.id);
            console.log("Set subwatershed name to:" + this.id);
        });
    });

   

    $(document).on("pagebeforechange",function(e, data){
        console.log("On page :" + data.toPage[0].id + " Last Site:" + sessionStorage.lastSite);
        if(data.toPage[0].id=="sitesPage"){
            if(typeof data.options.siteid==="undefined"){
             var site =  sessionStorage.lastSite;
            } else {
             var site = data.options.siteid;
            }
            showSites("#sitesPage",site);
        }
        if(data.toPage[0].id=="existingSitePage"){

            var site=sessionStorage.selectedSite;
            showSelectedSite("#existingSitePage",site);   
        }
    });
       
 } 
  function showSelectedSite(page,site){
   
   console.log("At site table:" + site);
   $('#siteTitle').text(site + " Sites");
    dbCon.transaction(function(tx){
        tx.executeSql('SELECT * FROM SITES WHERE XNAME = "'+site+'"',[],selQrySuccess2,errorCB);
    },errorCB);

 }   
 function selQrySuccess2(tx,results){
   // var row=results.rows.item[0]['XSTYPE'];
    $('#xname').text(results.rows.item(0)['XNAME']);
    $('#xstype').text(results.rows.item(0)['XSTYPE']);
    $('#wsName').text(results.rows.item(0)['SHED']);
    $('#swsName').text(results.rows.item(0)['SUBSHED']);
    $('#numObs').text(results.rows.item(0)['OCNT']);
    console.log("Opening Site:" + results.rows.item(0)['XID']);
    if(results.rows.item(0)['OCNT']>0){
            showObHistory("#existingSitePage",results.rows.item(0)['XID']);
    }

}
 function showObHistory(page,xid){
    dbCon.transaction(function(tx){
        tx.executeSql('SELECT * FROM HISTORY WHERE O_XID = "'+xid+'"',[],selQrySuccess3,errorCB);
    },errorCB);

 }
 function selQrySuccess3(tx,results){
   if(results.rows){
    
    var len=results.rows.length;
    console.log("Rows: " + len);

    if(len > 0){
        cleanObHistory();
        for(var i=0;i < len;i++){
            switch(i){
                case 0:
                $("#ohd1").text(results.rows.item(i).ODATE);
                $("#ces1").text(results.rows.item(i).OCE);
                $("#ees1").text(results.rows.item(i).OEE);
                $("#ras1").text(results.rows.item(i).OSCORE);   
                break;
                case 1:
                $("#ohd2").text(results.rows.item(i).ODATE);
                $("#ces2").text(results.rows.item(i).OCE);
                $("#ees2").text(results.rows.item(i).OEE);
                $("#ras2").text(results.rows.item(i).OSCORE);   
                break;
                case "2":
                $("#ohd3").text(results.rows.item(i).ODATE);
                $("#ces3").text(results.rows.item(i).OCE);
                $("#ees3").text(results.rows.item(i).OEE);
                $("#ras3").text(results.rows.item(i).OSCORE);   
                break;
                case "3":
                $("#ohd4").text(results.rows.item(i).ODATE);
                $("#ces4").text(results.rows.item(i).OCE);
                $("#ees4").text(results.rows.item(i).OEE);
                $("#ras4").text(results.rows.item(i).OSCORE);   
                break;
            } 
        }
    }
   }


}
function cleanObHistory(){
    $("#ohd1").text();
    $("#ces1").text();
    $("#ees1").text();
    $("#ras1").text();
    $("#ohd2").text();
    $("#ces2").text();
    $("#ees2").text();
    $("#ras2").text();
    $("#ohd3").text();
    $("#ces3").text();
    $("#ees3").text();
    $("#ras3").text();
    $("#ohd4").text();
    $("#ces4").text();
    $("#ees4").text();
    $("#ras4").text();
}
 function showSites(page,site){
   console.log("At Subwatershed:" + site);
   $('#siteTitle').text(site + " Sites");
    dbCon.transaction(function(tx){
        tx.executeSql('SELECT * FROM SITES WHERE SUBSHED = "'+site+'"',[],selQrySuccess,errorCB);
    },errorCB);

 }
 function selQrySuccess(tx,result){
    $('#sitesView').empty();
    $('input[data-type="search"]').val("");
    $('input[data-type="search"]').trigger("keyup");
    var newlist ="<ul data-role='listview'  id='sitesView' data-filter='true' data-filter-placeholder='Search for site...' data-inset='true' data-split-icon='gear' data-theme='a'>";
    $('#sitesView').append(newlist);  
    $.each(result.rows,function(index){

        var row = result.rows.item(index);
        var img="";
        //console.log("At selected site name:" + row['XNAME']);
        switch(row['XSTYPE']){
            case "Cross Drain":
            img="cd.png";
            break;
            case "Stream Crossing":
            img="sc.png";
            break;
            case "Erosional Feature":
            img="ef.png";
            break;
        }
        $('#sitesView').append('<li><a href="#existingSitePage" id="'+row['XNAME'] + '" class="liclick"><img src="img/' + img + '"/><h3>'+row['XNAME']+'</h3><p>'+row['XSTYPE']+'</p></a><a href="#siteMapPage"></a></li>');
    });
    $('#sitesView').append('</ul');   
    $('#sitesView').listview('refresh');
    $('.liclick').click(function(){
        sessionStorage.selectedSite=$(this).attr("id");
    })

 }


    
 function insertUsers(){
    dbCon.transaction(function(tx){
        tx.executeSql('DROP TABLE IF EXISTS USERS');
        tx.executeSql('CREATE TABLE IF NOT EXISTS USERS(USERNAME TEXT PRIMARY KEY NOT NULL,PWD TEXT NOT NULL,UID INT,FULLNAME TEXT,INITIALS TEXT)');
        var recursiveFunction = function(index) {
            if(index < resultUsersJSON.length){
               var sqlStr = 'INSERT INTO USERS (USERNAME,PWD,UID,FULLNAME,INITIALS) VALUES(?,?,?,?,?)'; 
                tx.executeSql(sqlStr,[
                    resultUsersJSON[index].userName,
                    resultUsersJSON[index].pwd,
                    resultUsersJSON[index].uid,
                    resultUsersJSON[index].fullName,
                    resultUsersJSON[index].init],
                    function(){
                        index++;recursiveFunction(index)
                    },errorCB2);
    

            }
        }
        recursiveFunction(0);
    })
 } 

 function insertSubsheds(){
    dbCon.transaction(function(tx){
        tx.executeSql('DROP TABLE IF EXISTS SUBSHEDS');
        tx.executeSql('CREATE TABLE IF NOT EXISTS SUBSHEDS(SUBWATERSHED TEXT PRIMARY KEY NOT NULL,SID INT ,SHEDID INT,SAREA LONG,WATERSHED TEXT,SITECNT INT)');
        var recursiveFunction = function(index) {
            if(index < resultShedsJSON.length){
               var sqlStr = 'INSERT INTO SUBSHEDS (SUBWATERSHED,SID,SHEDID,SAREA,WATERSHED,SITECNT) VALUES(?,?,?,?,?,?)'; 
                tx.executeSql(sqlStr,[
                    resultShedsJSON[index].Subwatershed,
                    resultShedsJSON[index].sid,
                    resultShedsJSON[index].shedID,
                    resultShedsJSON[index].sArea,
                    resultShedsJSON[index].Watershed,
                    resultShedsJSON[index].siteCnt],
                    function(){
                        index++;recursiveFunction(index)
                    },errorCB2);
                if(resultShedsJSON[index].siteCnt > 0){
                    $('<li><a class="ui-btn data" id="'+resultShedsJSON[index].Subwatershed + '" href="#"><h6>' + resultShedsJSON[index].Subwatershed + '</h6><p>Watershed:'+resultShedsJSON[index].Watershed+'</p></a><span class="ui-li-count">'+resultShedsJSON[index].siteCnt+'</span>').appendTo($('#subshedListView'));
                }
            }
        }
        recursiveFunction(0);
    })
 }

   function insertSites(){
    dbCon.transaction(function(tx){
        tx.executeSql('DROP TABLE IF EXISTS SITES');
        tx.executeSql('CREATE TABLE IF NOT EXISTS SITES(XNAME TEXT PRIMARY KEY NOT NULL,XSTYPE TEXT NOT NULL,XID INT,XLAT TEXT,XLONG TEXT,X_SHID INT,X_SID INT,SUBSHED TEXT,SHED TEXT,OCNT INT)');
        var recursiveFunction = function(index) {
            if(index < resultSitesJSON.length){
               var sqlStr = 'INSERT INTO SITES (XNAME,XSTYPE,XID,XLAT,XLONG,X_SHID,X_SID,SUBSHED,SHED,OCNT) VALUES(?,?,?,?,?,?,?,?,?,?)'; 
                tx.executeSql(sqlStr,[
                    resultSitesJSON[index].xname,
                    resultSitesJSON[index].xstype,
                    resultSitesJSON[index].xid,
                    resultSitesJSON[index].xlat,
                    resultSitesJSON[index].xlong,
                    resultSitesJSON[index].x_shid,
                    resultSitesJSON[index].x_sid,
                    resultSitesJSON[index].subshed,
                    resultSitesJSON[index].shed,
                    resultSitesJSON[index].oCnt],
                    function(){
                        index++;recursiveFunction(index)
                    },errorCB2);
                       

            }
        }
        recursiveFunction(0);
     })
 }
    function insertHistory(){
    dbCon.transaction(function(tx){
        tx.executeSql('DROP TABLE IF EXISTS HISTORY');
        tx.executeSql('CREATE TABLE IF NOT EXISTS HISTORY(OID INT PRIMARY KEY NOT NULL,O_XID INT NOT NULL,ODATE TEXT,OXTYPE TEXT,OCE TEXT,OEE TEXT,OSCORE TEXT)');
        var recursiveFunction = function(index) {
            if(index < resultHistoryJSON.length){
               var sqlStr = 'INSERT INTO HISTORY (OID,O_XID,ODATE,OXTYPE,OCE,OEE,OSCORE) VALUES(?,?,?,?,?,?,?)'; 
                tx.executeSql(sqlStr,[
                    resultHistoryJSON[index].oid,
                    resultHistoryJSON[index].o_xid,
                    resultHistoryJSON[index].odate,
                    resultHistoryJSON[index].oxtype,
                    resultHistoryJSON[index].oce,
                    resultHistoryJSON[index].oee,
                    resultHistoryJSON[index].oscore],
                    function(){
                        index++;recursiveFunction(index)
                    },errorCB2);
    

            }
        }
        recursiveFunction(0);
     })
 }
    function countUserRows(cb){
       dbCon.transaction(function(tx){
        var sqlStr = "SELECT userName FROM USERS";
            tx.executeSql(sqlStr,[],function(tx,results){
                var len = results.rows.length;
                cb.call(this,len);
            })
       }) 
        
    }
    function countSubshedRows(cb){
       dbCon.transaction(function(tx){
        var sqlStr = "SELECT SUBWATERSHED FROM SUBSHEDS";
            tx.executeSql(sqlStr,[],function(tx,results){
                var len = results.rows.length;
                cb.call(this,len);
            })
       }) 
        
    }
    function countSitesRows(cb){
       dbCon.transaction(function(tx){
        var sqlStr = "SELECT XNAME FROM SITES";
            tx.executeSql(sqlStr,[],function(tx,results){
                var len = results.rows.length;
                cb.call(this,len);
            })
       }) 
        
    }
    function countHistoryRows(cb){
       dbCon.transaction(function(tx){
        var sqlStr = "SELECT OID FROM HISTORY";
            tx.executeSql(sqlStr,[],function(tx,results){
                var len = results.rows.length;
                cb.call(this,len);
            })
       }) 
        
    }
     function countHistoryRows(cb){
       dbCon.transaction(function(tx){
        var sqlStr = "SELECT OID FROM HISTORY";
            tx.executeSql(sqlStr,[],function(tx,results){
                var len = results.rows.length;
                cb.call(this,len);
            })
       }) 
        
    }
    function errorCB2(tx,err){
        if(err){
        console.log("Error processing SQL: "+err.code+ " :"+err.message);
    }
    }
    function errorCB(tx,err){
        if(err){
        console.log("Error processing SQL: "+err.code);
        }
    }

    $(function(){
    	setTimeout(hideSplash,2000);
    });
    function hideSplash(){
    	$.mobile.changePage('#loginPage',{
    		transition: 'pop'
    	});
    }
    function isOnLine(){
        $('#internetConn').text(getConnectionTypeStr()).removeClass("subTxtFntOff").addClass("subTxtFntOn");
       localStorage.setItem("Connection",$('#internetConn').text(getConnectionTypeStr()));
    }
     function isOffLine(){
        $('#internetConn').text(getConnectionTypeStr()).removeClass("subTxtFntOff").addClass("subTxtFntOn");
        localStorage.setItem("Connection",$('#internetConn').text(getConnectionTypeStr()));
    }
    function getConnectionTypeStr(){
        var networkState=navigator.network.connection.type;
        console.log("network state:"+networkState);
        return states[networkState];
    }
    function onGeoLocationSuccess(loc){

        var d= new Date(loc.timestamp);
        $('#lat').text("Lat :"+loc.coords.latitude).removeClass("subTxtFntOff").addClass("subTxtFntOn");
        $('#lng').text("Lng :"+loc.coords.longitude).removeClass("subTxtFntOff").addClass("subTxtFntOn");

    }
    function onGeoLocationError(e){
alert(e.code + " " + e.message);
    }




    var date = new Date();
	var d  = date.getDate();
	var day = (d < 10) ? '0' + d : d;
	var m = date.getMonth() + 1;
	var month = (m < 10) ? '0' + m : m;
	var yy = date.getYear();
	var year = (yy < 1000) ? yy + 1900 : yy;
	var currentDate=year+"-"+month+"-"+day;
    $("#todaysDate").html("<b>Today's Date</b>: "+currentDate);


