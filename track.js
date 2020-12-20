/*!
 * SAP Web Analytics - Tracking Script
 *
 * Version: 0.1.3f
 *
 * (C) 2013-2015 SAP SE. All rights reserved.
 */
var swa = swa || {};
var siteProperties = siteProperties || {};
var sap = sap || {};
var _paq = _paq || [];
swa.logger = true;
var AnonymizationConfigurations = {};
var isHeartBeatEnabled = false;
var heartBeatInterval = 30;
var currentPageUrl = "";
var UI5EVENTS_WHITELIST = {
	"routeMatched": true
};
var loggedUrl = "";
var routeMatchedDisabled = false;

var varlength = 225;
var previous = {};
previous.timeStamp=0;


// Set swa default values for config variables not yet set
swa.variableInit = function () {

	var url = swa.baseUrl;
	//removing trailing slash
	swa.discoveryBaseURL = url.substring(0, url.charAt(url.length - 1) == "/" ? url.length - 1 : url.length);
	swa.discoveryBaseURL += '/public/site';

	if (typeof swa.cookiesEnabled === "undefined")
		swa.cookiesEnabled = true;
	if (typeof swa.loggingUrl === "undefined")
		swa.loggingUrl = swa.baseUrl;
	if (typeof swa.loggingEnabled === "undefined")
		swa.loggingEnabled = false;
	if (typeof swa.pageLoadEnabled === "undefined")
		swa.pageLoadEnabled = true;
	if (typeof swa.clicksEnabled === "undefined")
		swa.clicksEnabled = true;
	if (typeof swa.customEventsEnabled === "undefined")
		swa.customEventsEnabled = true;
	if (typeof swa.hotkeysEnabled === "undefined")
		swa.hotkeysEnabled = false;

	if (typeof swa.consentStyle === "undefined")
		swa.consentStyle = "banner";
	if (typeof swa.consentOnLoad === "undefined")
		swa.consentOnLoad = "true";
	if (typeof swa.isConsentGiven === "undefined")
		swa.isConsentGiven = false;
	if (typeof swa.parentCookies === "undefined")
		swa.parentCookies = [];
	
	if (typeof swa.sessionCookieTimeout === "undefined") {
		// 30 min in s (Piwik: _swa_ses cookie)
		swa.sessionCookieTimeout = 1800;
	}
	
	if (typeof swa.referralCookieTimeout === "undefined") {
		// 6 months in s (Piwik: _swa_ref cookie)
		swa.referralCookieTimeout = 15778463;
	}
	if (typeof swa.frameExclusionSelector === "undefined") {
		// jQuery selector to exclude matching iframes from tracking when swa.trackFrames = true
		swa.frameExclusionSelector = ".swa_ignore"; //class="swa_ignore ..."
	}
	if (typeof swa.textExclusionSelector === "undefined") {
		swa.textExclusionSelector = "";
	}
	if (typeof swa.referrerOfTop === "undefined") {
		swa.referrerOfTop = false;
	}

	swa.currentEvent = "";

	//Set clientSideAnonymization values if they are provided in snippet

	if (typeof swa.clientPrefAnonymityEnabled !== "undefined") {
		swa.clientPrefAnonymityEnabledVal = typeof swa.clientPrefAnonymityEnabled == 'function' ? swa.clientPrefAnonymityEnabled() : swa.clientPrefAnonymityEnabled;
	}

	if (typeof swa.clientSpecsAnonymityEnabled !== "undefined") {
		swa.clientSpecsAnonymityEnabledVal = typeof swa.clientSpecsAnonymityEnabled == 'function' ? swa.clientSpecsAnonymityEnabled() : swa.clientSpecsAnonymityEnabled;
	}

	if (typeof swa.createdTimeAnonymityEnabled !== "undefined") {
		swa.createdTimeAnonymityEnabledVal = typeof swa.createdTimeAnonymityEnabled == 'function' ? swa.createdTimeAnonymityEnabled() : swa.createdTimeAnonymityEnabled;
	}

	if (typeof swa.locationAnonymityEnabled !== "undefined") {
		swa.locationAnonymityEnabledVal = typeof swa.locationAnonymityEnabled == 'function' ? swa.locationAnonymityEnabled() : swa.locationAnonymityEnabled;
	}
	
	//By default, xhr request tracking is disabled
	if(typeof swa.xhrEnabled === undefined)
		swa.xhrEnabled = false;
	
	//Set loggingEnabled as false if browser DNT Settings are ON
	if(window.navigator.doNotTrack == "1"){
		swa.loggingEnabled = false;
		
		//If XHR tracking is enabled, disable it explicitly when browser DNT settings are ON
		swa.xhrEnabled = false;
	}
};

// Called to init SWA after we made sure jQuery exists
swa.documentReady = function () {
	// Init variables
	swa.variableInit();

	//Starts tracking based on Site preferences.
	// getPreferences();

	// // Add click functions to hide / show license elements
	// swa.jQuery('#swa_background, .close_license').click(function (event) {
	// 	swa.jQuery('#swa_background').fadeOut(500);
	// 	swa.jQuery('#swa_license').fadeOut(500);
	// 	event.preventDefault();
	// });

	// window.setTimeout(function () {
	// 	swa.jQuery('.showlicense').click(function (event) {
	// 		var wheight = swa.jQuery(window).height();
	// 		var wwidth = swa.jQuery(window).width();
	// 		var mheight = swa.jQuery('#swa_license').outerHeight();
	// 		var mwidth = swa.jQuery('#swa_license').outerWidth();
	// 		var top = (wheight - mheight) / 2;
	// 		var left = (wwidth - mwidth) / 2;
	// 		swa.jQuery('#swa_license').css({ 'top': top, 'left': left });
	// 		swa.jQuery('#swa_background').css({ 'display': 'block', opacity: 0 });
	// 		swa.jQuery('#swa_background').fadeTo(500, 0.8);
	// 		swa.jQuery('#swa_license').fadeIn(500);
	// 		event.preventDefault();
	// 	});
	// }, 1000);

	//Enable UI5 events 
	if(swa._isUI5()){
		swa._enableUI5Events();
	}else{
		window.setTimeout(function () {
			if(swa._isUI5())
				swa._enableUI5Events();
		}, 5000);
	}
	swa.enable();
};

//Creates SWA Banner to get visitor cookie consent from user
function addBanner () {
	//Get the swa.consentStyle and swa.consentOnLoad 
	//if consentStyle popup show pop up on load is true
	//show banner and pop up  if tracking status is ooff
	if(swa.loggingEnabled == false){
	if(swa.consentStyle =="popup" && swa.consentOnLoad){
		//show consent pop up
		showConsentForm(false);
	}else if(swa.consentStyle =="banner" && swa.consentOnLoad){
	if (swa.jQuery('.swa_banner').length === 0) {

		swa.jQuery('body').append('<style>.swa_banner {font-family:Arial,Helvetica,sans-serif;width: 100%;height: auto;min-height: 20px;background-color: #FFFFFF;z-index: 9999;position: absolute;left: 0;top: 0;font-size:80%; padding: 10px 10px 10px 10px;}.swa_banner p {display: inline;position: static;left: 0px; word-spacing:1px;line-height: 17px;}.swa_banner img{vertical-align:top;}.swa_banner form {display: inline;position: absolute;right: 0px;margin-right: 25px;}#buttonsDiv{float: right;margin-right:30px;padding: 5px 5px 0 0;}.bannerButton {margin-right:15px;background-color: #0066ff;border: none;color: white;padding:5px 5px;font-size: 12px;cursor: pointer;width: 60px;border-radius:4px;}.bannerButton:hover{background-color: #075caf;} button#yesButton:disabled { opacity: 0.3; background-color:#0066ff}</style><div id="swa_banner" class="swa_banner"><p><strong>This site uses SAP Web Analytics to analyze how users use this site. The information generated (including a part of your IP address and a browser ID) will be transmitted to and stored by SAP on its servers. Cookies are used to identify your repeat visit and your visit origin page. We will use this information only for the purpose of evaluating website usage and compiling reports on website activity for website operators - and finally, to improve  the site\n.	If you would like to opt-in for SAP Web Analytics tracking, please specify your preference using the "Allow" button below. By opt-in, you consent to the processing of analytics data about you in the manner and for the purposes set out above.</strong></p></br><hr><div id="buttonsDiv" ><button type="button" id="yesButton" class = "bannerButton" onclick="banner_save(event); return false;">Allow</button><button type="button" class = "bannerButton" id="noButton" onclick="banner_save(event); return false;">Deny</button><a href="#" title="Close" style="margin-top:5px; margin-left:20px;" onclick="banner_save(event); return false;"><img id="closeButton" onclick="banner_save(event); return false;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAACIiIhaeOqmAAAAAXRSTlMAQObYZgAAAC9JREFUaN5jYGBgEOBgsJBhqLFjsKthkP/BwP+Bgf0BCAEZQC5QECgFVABUxsAAAOcxCbuaDAybAAAAAElFTkSuQmCC" /></a></div>');          
    }
	swa.jQuery('.swa_banner').hide();
	}
}
	else{
		console.log("Enabled only if tracking is off.")
	}
};

//Function to save cookie consent decision
function banner_save(event) {
	
	//Close the banner
	if(swa.consentStyle =="banner")
	swa.jQuery('.swa_banner').slideUp();
	else{
		swa.jQuery('#swa_consentform').slideUp();
		removeConsentForm();
	}
	//event.preventDefault();
	
	var buttonId = event.target.id || event.srcElement.id;
	
	/**Based on the consent, create a cookie with appropriate values
	 * 1 - Accept, 0 - Deny, 2 - Defer decision
	 */
	
	if(buttonId === "yesButton"){
		createSWACookie("tracking_consent", 1);
		swa.enable();
	}
	else if(buttonId === "noButton"){
		createSWACookie("tracking_consent", 0);
	}
	else if (buttonId === "closeButton"){
		createSWACookie("tracking_consent", 2);
	}else if(buttonId === "swaconsent_notnow_modal"){
		createSWACookie("tracking_consent", 0);
	}else if(buttonId === "swaconsent_allow_modal"){
		createSWACookie("tracking_consent", 1);
		swa.enable();
	}
};

//Handles consent

function getPreferences() {
	var url = swa.discoveryBaseURL + "/preferences?siteId=" + swa.pubToken;

	var promisePref = swa.ajaxRequest(url, "GET");

	promisePref.then(preferencesDone);

}


 function getSWACookieValue(cookies) {
 	var cookiesArr = [],name = '_swa',j=0,swaCookies=[] ;
    if (!cookies) {
     return null;
    }
    swaCookies = cookies.split(";");
   for (var i = 0; i < swaCookies.length; i++) {
       var cookie = swaCookies[i].trim();
       if (cookie.indexOf(name) == 0) {
       cookiesArr[j++]= cookie;
       }
   }
   return cookiesArr;
   }
   
function preferencesDone(pubTokenAttributes) {


	//Get Server side anonymization settings
	AnonymizationConfigurations.clientPrefAnonymityServerVal = pubTokenAttributes.clientPrefAnonymity;
	AnonymizationConfigurations.clientSpecsAnonymityServerVal = pubTokenAttributes.clientSpecsAnonymity;
	AnonymizationConfigurations.createdTimeAnonymityServerVal = pubTokenAttributes.createdTimeAnonymity;
	AnonymizationConfigurations.locationAnonymityServerVal = pubTokenAttributes.locationAnonymity;

	//Get Client side anonymization override decision settings
	AnonymizationConfigurations.overrideClientPrefAnonymity = pubTokenAttributes.overrideClientPrefAnonymity;
	AnonymizationConfigurations.overrideClientSpecsAnonymity = pubTokenAttributes.overrideClientSpecsAnonymity;
	AnonymizationConfigurations.overrideCreatedTimeAnonymity = pubTokenAttributes.overrideCreatedTimeAnonymity;
	AnonymizationConfigurations.overrideLocationAnonymity = pubTokenAttributes.overrideLocationAnonymity;
	
	//Atleast one server side property should be anonymized and atleast one should be overridden in cient side
	if ((AnonymizationConfigurations.clientPrefAnonymityServerVal && AnonymizationConfigurations.overrideClientPrefAnonymity) || (AnonymizationConfigurations.clientSpecsAnonymityServerVal && AnonymizationConfigurations.overrideClientSpecsAnonymity) || (AnonymizationConfigurations.createdTimeAnonymityServerVal && AnonymizationConfigurations.overrideCreatedTimeAnonymity) || (AnonymizationConfigurations.locationAnonymityServerVal && AnonymizationConfigurations.overrideLocationAnonymity)) {
		swa.overrideServerAnonymization = true;
	}

	isHeartBeatEnabled = pubTokenAttributes.heartBeat;
	heartBeatInterval  = pubTokenAttributes.heartBeatInterval;
	
	//Get GDPR related site & space settings
	siteProperties.hasCustomFields = pubTokenAttributes.hasCustomFields;
	siteProperties.hasPersonalData = pubTokenAttributes.hasPersonalData;
	siteProperties.internalApplicationUser = pubTokenAttributes.internalApplicationUser;
	siteProperties.visitorUUIDAnonymity = pubTokenAttributes.visitorUUIDAnonymity;
	
	//Set default visitor anonymity setting as OFF
	if(typeof siteProperties.visitorUUIDAnonymity === "undefined"){
		siteProperties.visitorUUIDAnonymity = 0;
	}
	
	//Delete all the existing cookies if anonymity is ON
	if(siteProperties.visitorUUIDAnonymity)
		swa.deleteCookies();
	
	//Set owner property based on it's type - function or attribute
	if (typeof swa.owner == 'function')
		swa.siteOwner = swa.owner();
	else
		swa.siteOwner = swa.owner;

	//For internal users whose visitor anonymity setting is off, cookie timeout is the minimum of customer set timeout and space admin set timeout
	if(!siteProperties.visitorUUIDAnonymity && siteProperties.internalApplicationUser){
		swa.cookieTimeoutForVisitor = (pubTokenAttributes.cookieTimeOut <= pubTokenAttributes.globalCookieTimeout*86400) ? pubTokenAttributes.cookieTimeOut : pubTokenAttributes.globalCookieTimeout*86400;
	}
	else{
		swa.cookieTimeoutForVisitor = pubTokenAttributes.cookieTimeOut;
	}
	
	//Banner property
	siteProperties.bannerEnabled = pubTokenAttributes.bannerEnabled;
	
	//Session timeout cannot be more than 24 hours
	if(swa.sessionCookieTimeout > 24*60*60){
		console.warn("Resetting session timeout to 1 day. Session timeout cannot be more than 1 day.");
		swa.sessionCookieTimeout = 24*60*60;
	}
	
	//If set as session is used, set cookie timeout as 30 mins
	if(swa.cookieTimeoutForVisitor === -1 && swa.sessionCookieTimeout > 1800){
		swa.sessionCookieTimeout = 1800;
		swa.cookieTimeoutForVisitor = (new Date("2099-12-31 23:59:59") - new Date())/1000; //Set cookie timeout as some future value as it is not relevant and visitor is reset for every new session, here, 31st Dec, 2099
		swa.setAsSession = 1;
		console.warn("Resetting session timeout to 30 minutes. Session timeout cannot be more than 30 minutes if Set as Session in Site Management is turned on.");
	}
	else if(swa.cookieTimeoutForVisitor == -1 && swa.sessionCookieTimeout <= 1800){
		swa.setAsSession = 1; 
		swa.cookieTimeoutForVisitor = (new Date("2099-12-31 23:59:59") - new Date())/1000; //Set cookie timeout as some future value as it is not relevant and visitor is reset for every new session, here, 31st Dec, 2099
	}
	
     
	/**Tracking is OFF by default except in some cases
	 * Case 1 - when anonymity is off and banner is disabled by customer for internal users
	 * Case 2 - when anonymity is ON
	 * Case 3 - If banner is used and consent is already given
	 */
	swa.loggingEnabled = false;
	
	//Web Gui Integration Scenario
	if(swa.isConsentGiven){
		//include only swa cookies
		var swaCookies = this.getSWACookieValue(swa.parentCookies);
		//read and save the cookievalues
		for (var i = 0; i < swaCookies.length; i++) {  
			   document.cookie = swaCookies[i];
	  }
	}
	
	if(!siteProperties.visitorUUIDAnonymity && !siteProperties.bannerEnabled && !pubTokenAttributes.globalBannerEnabled && siteProperties.internalApplicationUser && !siteProperties.hasPersonalData)
		swa.loggingEnabled = true;
	else if(siteProperties.visitorUUIDAnonymity)
		swa.loggingEnabled = true;
	else if(siteProperties.bannerEnabled && swa.getCookieValue("_swa_tracking_consent."+swa.pubToken) == 1 && !siteProperties.hasPersonalData)
		swa.loggingEnabled = true;

	//If banner is disabled, clear tracking cookie if any
	if(!siteProperties.bannerEnabled && swa.getCookieValue("_swa_tracking_consent."+swa.pubToken) != null){
		deleteSWACookies("_swa_tracking_consent");
	}

	if (typeof swa.dntLevel !== "undefined")
		swa.swaDntLevel = swa.dntLevel;
	else
		swa.swaDntLevel = 1;

	if(pubTokenAttributes.ui5Events == 1 )
		whiteListUI5Events();
	
	if(siteProperties.bannerEnabled && !siteProperties.visitorUUIDAnonymity && !siteProperties.hasPersonalData){
		//If cookie consent exists, do not show the banner
		if(swa.getCookieValue("_swa_tracking_consent."+swa.pubToken) == null && swa.consentOnLoad && !swa.isConsentGiven){
			
			//Delete existing cookies if any
			swa.deleteCookies();
			//Show the banner to get cookie consent
			if(swa.consentOnLoad){
				//Delay banner/popup display for 5 seconds
				if(swa.consentStyle == "banner"){
					window.setTimeout(function () {
						swa.jQuery('.swa_banner').slideDown();
					}, 5000);
				}
				else{
					window.setTimeout(function () {
						swa.jQuery('#swa_background').fadeTo(500, 0.8);	
						swa.jQuery('#swa_consentform').fadeIn(500);	
					}, 5000);
				}
			}
		
			//Delay banner display by 5 seconds to handle applications which take time to load
			window.setTimeout(function () {
				addBanner();
				swa.jQuery('.swa_banner').slideDown();
			}, 5000);
		}
		else{
			if(swa.setAsSession)
			{
				//If set as session is ON, banner is enabled and tracking decision is deny/defer, show banner every 24 hours or on browser close, whichever is earlier
				if(siteProperties.bannerEnabled && swa.getCookieValue("_swa_tracking_consent."+swa.pubToken) != "1" && swa.consentOnLoad && !swa.isConsentGiven){
					//Show banner if 24 hours have passed from the time the last tracking consent was given
					var createdTime = swa.getCookieValue("_swa_tracking_consent."+swa.pubToken).slice(2);
					if(new Date()/1000 - createdTime >= 86400){
						//Delete existing cookies if any
						swa.deleteCookies();
						
						
					
						//Delay banner display by 5 seconds to handle applications which take time to load
						window.setTimeout(function () {
							//Show the banner to get cookie consent
							addBanner();
							swa.jQuery('.swa_banner').slideDown();
						}, 5000);
					}
				}
			}
		}
	}

	swa.tracker_init();

};

swa.ajaxRequest = function (URL, method) {

	var requestPromise = new Promise(function (resolve) {

		swa.jQuery.ajax({
			url: URL,
			type: method,
			cache: false,
			success: function (response) {
				resolve(response);
			},
			error: function (response) {
				console.log("Error" + JSON.stringify(response));
			}
		});
	});

	return requestPromise;
};

/**Called in case of No-No. Handles various scenarios like browser dnt,
 * banner & cookie 
 */
swa.tracker_init = function () {

	if (swa.loggingEnabled && !swa.loggerLoaded) {
		swa.loadLogger();
	}
};

function enableHeartbeat(){
	if (isHeartBeatEnabled){
		window.addEventListener('focus', _swaAppOnFocus);
		_paq.push(['enableHeartBeatTimer',heartBeatInterval]); 
	}
}

window.postload = function(){
	//Send Custom Event on XHR Request completion - only if tracking is enabled
		var params = {detail: {"requestUrl": window.sUrl, "requestMethod": window.sMethod, "responseTime": new Date().getTime() - window.startTime, "responseStatus": this.status}};
		//Non-IE Browsers
		if (typeof window.CustomEvent === "function" ){
			var xhrEvent = new CustomEvent('xhr', params);
			window.dispatchEvent(xhrEvent);
		}
		else{
			var xhrEvent = document.createEvent('CustomEvent');
			xhrEvent.initCustomEvent('xhr', false, false, params.detail);
			window.dispatchEvent(xhrEvent);
		}	
}

swa.loadLogger = function () {

	//If piwik is loaded already, return
	if (swa.loggerLoaded)
		return;

	var u = swa.baseUrl, l = swa._addScript;
	_paq.push(["setSiteId", swa.pubToken]);
	_paq.push(["setTrackerUrl", swa.loggingUrl + "log"]);
	_paq.push(["setDoNotTrack", true]);
	 if(!swa.isConsentGiven)
	_paq.push(["setCookieNamePrefix", "_swa_"]);
	enableHeartbeat();
	_paq.push(["setCustomRequestProcessing", function (data) {
		// Check the request string already prepared by Piwik for this event, if
		// we need to manually do some adjustments. Adjustments will be made in
		// these cases:
		// 1) page title reported by Piwik does not match the current title
		// 2) URL reported by Piwik does not match the current URL or the URL
		//    needs change by a defined swa.urlFormatterCallback function.
		// 3) Referrer reported by Piwik does not match the current referrer or
		//    the referrer needs change by a defined swa.urlFormatterCallback function.
		// If correction is needed, we will have to rebuild the request string
		// and replace URL set by Piwik.
		if (data) {
			//console.log("setCustomRequestProcessing - data: " + data);

			// Parse key value pairs from Piwik's request string (should contain param with key "url" and "pageTitle")
			var reportedParams = {};
			var reportedParamPairs = data.split("&");
			for (var i = 0; i < reportedParamPairs.length; i++) {
				var reportedParamPair = reportedParamPairs[i].split("=");
				reportedParams[decodeURIComponent(reportedParamPair[0].replace(/\+/g, '%20'))] = decodeURIComponent(reportedParamPair[1].replace(/\+/g, '%20'));
			}
			//for (var paramName in reportedParams) {
			//    console.log("setCustomRequestProcessing - reportedParams: " + paramName + "=" + reportedParams[paramName]);
			//}

			// Do we need to rebuild query string?
			var rebuildData = false;

			// Check URL
			if ((window) && (window.location)) {
				// Get the current URL as reported by the browser
				var currentURL = window.location.href;
				//console.log("setCustomRequestProcessing - currentURL: " + currentURL);
				// If swa.urlFormatterCallback is defined, call it with current URL and signal it's the URL of the page
				if (typeof swa.urlFormatterCallback === "function") {
					//console.log("setCustomRequestProcessing - calling swa.urlFormatterCallback for page URL");
					currentURL = swa.urlFormatterCallback(currentURL, "page");
					//console.log("setCustomRequestProcessing - page URL received from callback: " + currentURL);
				}
				// Check if param "url" exists and if it has the same value as the current (or changed) URL 
				if ("url" in reportedParams) {
					//console.log("setCustomRequestProcessing - Piwik's reported URL: " + reportedParams.url);
					if (reportedParams.url != currentURL) {
						//console.log("setCustomRequestProcessing - mismatch: Reported URL does not match current URL!!!");
						// Obviously Piwik is wrong about the current URL. So first we update current URL in Piwik.
						if (typeof Piwik !== "undefined")
							/*global Piwik*/
							Piwik.getAsyncTracker().setCustomUrl(currentURL);
						// Second, we correct the URL in the current event
						reportedParams.url = currentURL;
						// And we signal that query string needs to be rebuild
						rebuildData = true;
					}
				}
			}

			// Check referrer
			var currentReferrer = "";
			
			if(currentPageUrl!="" && currentPageUrl!=reportedParams.url){
				currentReferrer = currentPageUrl;
				currentPageUrl = reportedParams.url;
			}else{
				currentPageUrl=reportedParams.url;
			}
			
			if (swa.referrerOfTop) {
				//console.log("setCustomRequestProcessing - swa.referrerOfTop is true");
				// Get the current referrer the same way as Piwik tries to get it
				try {
					currentReferrer = window.top.document.referrer;
					//console.log("setCustomRequestProcessing - window.top.document.referrer: " + currentReferrer);
				} catch (e) {
					// Ignore
				}
				if (currentReferrer === "") {
					try {
						currentReferrer = window.parent.document.referrer;
						//console.log("setCustomRequestProcessing - window.parent.document.referrer: " + currentReferrer);
					} catch (e) {
						// Ignore
					}
				}
			}
			if ((currentReferrer === "") && (document)) {
				currentReferrer = document.referrer;
				//console.log("setCustomRequestProcessing - document.referrer: " + currentReferrer);
			}
			//console.log("setCustomRequestProcessing - currentReferrer: " + currentReferrer);
			// If swa.urlFormatterCallback is defined, call it with current referrer and signal it's the URL of the referrer
			if (typeof swa.urlFormatterCallback === "function") {
				//console.log("setCustomRequestProcessing - calling swa.urlFormatterCallback for referrer URL");
				currentReferrer = swa.urlFormatterCallback(currentReferrer, "referrer");
				//console.log("setCustomRequestProcessing - referrer URL received from callback: " + currentReferrer);
			}
			// Check if param "urlref" exists and if it has the same value as the current (or changed) referrer 
			if ("urlref" in reportedParams) {
				//console.log("setCustomRequestProcessing - Piwik's reported referrer: " + reportedParams.urlref);
				if (reportedParams.urlref != currentReferrer) {
					//console.log("setCustomRequestProcessing - mismatch: Reported referrer does not match current referrer!!!");
					// Obviously Piwik is wrong about the current referrer. So first we update current referrer in Piwik.
					if (typeof Piwik !== "undefined")
						Piwik.getAsyncTracker().setReferrerUrl(currentReferrer);
					// Second, we correct the referrer in the current event
					reportedParams.urlref = currentReferrer;
					// And we signal that query string needs to be rebuild
					rebuildData = true;
				}
			}else{
				if(currentReferrer!=""){
					reportedParams.urlref = currentReferrer;
				}
			}

			// Check page title
			if (document) {
				// Note: This also works if document.title is dynamically changed
				var titleTags = document.getElementsByTagName("title");
				if (titleTags.length > 0) {
					var currentPageTitle = titleTags[0].innerHTML;
					//console.log("setCustomRequestProcessing - currentPageTitle: " + currentPageTitle);
					// Check if param "pageTitle" exists and if it has the same value as the current page title
					if ("pageTitle" in reportedParams) {
						//console.log("setCustomRequestProcessing - Piwik's reported page title: " + reportedParams.pageTitle);
						if (reportedParams.pageTitle != currentPageTitle) {
							// Obviously Piwik is wrong about the current page title, so first we update current title in Piwik.
							if (typeof Piwik !== "undefined")
								Piwik.getAsyncTracker().setDocumentTitle(currentPageTitle);
							//console.log("setCustomRequestProcessing - mismatch: Reported page title does not match current page title!!!");
							// Second, we correct the page title in the current event
							reportedParams.pageTitle = currentPageTitle;
							// And we signal that query string needs to be rebuild
							rebuildData = true;
						}
					}
				}
			}
			
			//Delete visitor info if tracking is done anonymously
			if(siteProperties.visitorUUIDAnonymity){
				delete reportedParams._id;
				// Signal that query string needs to be rebuild
				rebuildData = true;
			}
			
			if(!siteProperties.hasCustomFields){
				reportedParams = removeCustomFields(reportedParams);
				rebuildData = true;
			}
			
			//If visitor anonymity if OFF and visitor cookie timeout is set as session, reset visitor for every session
			if(!siteProperties.visitorUUIDAnonymity && swa.setAsSession && reportedParams["_idvc"] > "1"){
				resetVisitor(); //Create a new visitor
				rebuildData = true;
				reportedParams._idvc = "1"; //Setting current event's visit count to 1			
			}
			
			//If banner is enabled, show banner on every session increment
			if(!siteProperties.visitorUUIDAnonymity && siteProperties.bannerEnabled && swa.getCookieValue("_swa_tracking_consent."+swa.pubToken) == null && !siteProperties.hasPersonalData && swa.consentOnLoad && !swa.isConsentGiven
					){
				swa.loggingEnabled = false;
				if(window.cXMLHttpRequest)
					window.cXMLHttpRequest.enableTracking = false;
					
				window.setTimeout(function () {
					addBanner();
					swa.jQuery('.swa_banner').slideDown();
				});
				return;
			}

			//Check for the dataAnonymiseCallback existence
			if (typeof swa.dataAnonymiseCallback === "function") {
				var anonymCollection;
				anonymCollection = swa.dataAnonymiseCallback(reportedParams);

				//If customer anonymized any properties, update them to parameter list
				if (typeof anonymCollection === "object" && Object.keys(anonymCollection).length > 0) {
					swa.anonymization(anonymCollection, reportedParams);
					rebuildData = true;
				}
			}

			//Add query params to Override Server side anonymization
			if (swa.overrideServerAnonymization) {

				if (AnonymizationConfigurations.overrideClientPrefAnonymity && AnonymizationConfigurations.clientPrefAnonymityServerVal && typeof swa.clientPrefAnonymityEnabled !== "undefined") {
					reportedParams["clientPrefAnonymity"] = swa.clientPrefAnonymityEnabledVal;
				}

				if (AnonymizationConfigurations.overrideClientSpecsAnonymity && AnonymizationConfigurations.clientSpecsAnonymityServerVal && typeof swa.clientSpecsAnonymityEnabled !== "undefined") {
					reportedParams["clientSpecsAnonymity"] = swa.clientSpecsAnonymityEnabledVal;
				}

				if (AnonymizationConfigurations.overrideCreatedTimeAnonymity && AnonymizationConfigurations.createdTimeAnonymityServerVal && typeof swa.createdTimeAnonymityEnabled !== "undefined") {
					reportedParams["createdTimeAnonymity"] = swa.createdTimeAnonymityEnabledVal;
				}

				if (AnonymizationConfigurations.overrideLocationAnonymity && AnonymizationConfigurations.locationAnonymityServerVal && typeof swa.locationAnonymityEnabled !== "undefined") {
					reportedParams["locationAnonymity"] = swa.locationAnonymityEnabledVal;
				}

				rebuildData = true;
			}


			// If we did any corrections to the parameters, we need to rebuild the query string
			if (rebuildData === true) {
				var newReportedParams = [];
				for (var paramName in reportedParams) {
					if (reportedParams.hasOwnProperty(paramName)) {
						newReportedParams.push(encodeURIComponent(paramName) + '=' + encodeURIComponent(reportedParams[paramName]));
					}
				}
				data = newReportedParams.join('&');
			}

			// Pass query string back to Piwik, which will then send it to the server
			return data;
		}
	}]);
	
		if (typeof swa.sessionCookieTimeout !== "undefined") {
			_paq.push(["setSessionCookieTimeout", swa.sessionCookieTimeout]);
		}
		if (typeof swa.cookieTimeoutForVisitor !== "undefined") {
			_paq.push(["setVisitorCookieTimeout", swa.cookieTimeoutForVisitor]);
		}
		if (typeof swa.referralCookieTimeout !== "undefined") {
			_paq.push(["setReferralCookieTimeout", swa.referralCookieTimeout]);
		}

	if (!swa.cookiesEnabled)
		_paq.push(["disableCookies"]);
	if(window.location === window.parent.location || swa.isConsentGiven){
		if (!window.Piwik) {
		l(u + "js/piwik.js", function () {
				loadSWAPiwikPlugin(u);
			});
		}
		else {
			loadSWAPiwikPlugin();
		}
		swa.loggerLoaded = true;
	}
};

//Function delete custom fields
function removeCustomFields(params){
	for(i=1; i<=10; i++){
		if(params["custom"+i] != undefined)
			delete params["custom"+i];
	}
	return params;
};

//Function to retrieve cookie value
swa.getCookieValue = function (cookie_name) {
	
	var c_value = document.cookie;
	var c_end;
	var c_start = c_value.indexOf(" " + cookie_name + "=");
	if (c_start == -1)
		c_start = c_value.indexOf(cookie_name + "=");
	if (c_start == -1) {
		c_value = null;
	} else {
		c_start = c_value.indexOf("=", c_start) + 1;
		c_end = c_value.indexOf(";", c_start);
		if (c_end == -1)
			c_end = c_value.length;
		c_value = unescape(c_value.substring(c_start, c_end));
	}

	return c_value;
};

function createSWACookie(cookieName, cookieVal) {
	
	/** If it is a consent cookie and the user accepts/denies giving the consent,
	 *  create the cookie with user defined expiry. If the user defers the decision,
	 *  cookie is created with default expiry, (i.e) the validity of the cookie will be the session.
	 *  Cookie value 1 means user has consented to store cookie, 0 means user has denied and 2 means user has deferred
	 *  the decision until the next session
	 */
	if(cookieName == "tracking_consent"){
		
		//If visitor cookie timeout is set as session, create a cookie with session expiry
		if(swa.setAsSession == 1){
			if(cookieVal == 0 || cookieVal == 2)
				cookie = "_swa_" + cookieName + "." + swa.pubToken + "=" + cookieVal + "."+new Date()/1000;
			else
				cookie = "_swa_" + cookieName + "." + swa.pubToken + "=" + cookieVal;
		}
		else{
			if(cookieVal == 1){
				validUntil = Date.now() + swa.cookieTimeoutForVisitor * 1000;
				expiryDate = new Date(parseInt(validUntil, 10));
				
				cookie = "_swa_" + cookieName + "." + swa.pubToken + "=" + cookieVal + "; expires=" + expiryDate.toUTCString();
			}
			//Create a cookie with expiry as defer cookie timeout(if any) provided the user has denied giving consent
			else if(cookieVal == 0 && swa.deferCookieTimeout != undefined){
				validUntil = Date.now() + swa.deferCookieTimeout * 1000;
				expiryDate = new Date(parseInt(validUntil, 10));
				cookie = "_swa_" + cookieName + "." + swa.pubToken + "=" + cookieVal + "; expires=" + expiryDate.toUTCString();
			}
			else
				var cookie = "_swa_" + cookieName + "." + swa.pubToken + "=" + cookieVal;
		}
		
		cookie += "; path=/";
		document.cookie = cookie;
	}
	else{
		var cookie = "_swa_" + cookieName + "." + swa.pubToken + "=" + cookieVal + "; path=/";
		document.cookie = cookie;
	}
}

function resetVisitor(){
	_paq.push(["deleteCookies"]); // Reset visitor cookie
	swa.deleteCookies(); // Deletes rest of the cookies
}

function loadSWAPiwikPlugin() {

	swa.variableInit();
	
	loadPlugin(function () {
		Piwik.addPlugin("swa", swa.plugin);
		if (swa.logger) {
			
			swa.loggingEnabled = true;
			
			swa.trackLoad();
			
			swa.logger = false;

			if(swa._isUI5()){
				
				loggedUrl = window.location.href;

				//Setting this flag to true so that the first RouteMatched event will be ignored
				routeMatchedDisabled = true; 	
			}
		}

		//If AJAX tracking is enabled, load XMLHttpRequest.js file which wraps the browser's xhr object
		if (swa.xhrEnabled){
			swa._addScript(swa.baseUrl + "js/XMLHttpRequest.js", function (){
				//Add the xhr event listener
				trackXHR();
			});
		}
		
		// Trigger callback for "everything for tracking is loaded now - tracker ready" (if it exists).
		// Check if swa object has a function in property "trackerReadyCallback" - if yes, call it.
		if (typeof swa.trackerReadyCallback === "function") {
			try {
				swa.trackerReadyCallback();
			} catch (ex) {
				// Ignore exceptions
			}
		}
	});
}

function loadPlugin(callback){

	addPluginContextToSWA();

	addPluginEventHandlers();
	
	callback();
}

function addPluginEventHandlers(){
	
	// Attach event handler to automatically send click events
	var elements = swa.jQuery("*");
	if (swa.trackFrames === true) {
		// Add the root HTML elements within iframes that don't match the frameExclusionSelector.
		swa.jQuery.each(swa.jQuery("iframe:not('" + swa.frameExclusionSelector + "')"), function(name, frame) {
		try {
			elements.push(swa.jQuery(frame).contents().find('html')[0]);
		}catch (err) {
			// Accessing the contents of an iframe that is not from the same origin (cross-origin frame) throws a SecurityError.
			// See https://en.wikipedia.org/wiki/Same-origin_policy
			// We cannot register tracking event handlers to cross-origin frames.
		}
	});
	}	

	var elementSelector = ":not('.swa_ignore')"; //ignore elements with class='swa_ignore'
	swa.jQuery(elements).on("click.swa", elementSelector, function(event) {
	
	// This function is only triggered by elements matching the elementSelector.
	if (swa.loggingEnabled && swa.clicksEnabled) {
		// Ensure that the DOM element that triggers the event is the one that has been clicked,
		// i.e. not an ancestor, in case the clicked element does not match the elementSelector.
		if (this === event.target) {
			// Ensure we do not track events more than once, if the click event bubbles
			if (previous.timeStamp !== event.timeStamp) {
				previous.timeStamp = event.timeStamp;
				// save element to the queue for later use in the plugin code
				swa.plugin.clickedElements.push(event);
				Piwik.getAsyncTracker().trackLink("click", "event_type");
			}
		}
	}
	});

	// Attach event handler to automatically send keypress/hotkey events
	swa.jQuery(window).keydown(function(e) {
	if (swa.hotkeysEnabled && (e.ctrlKey || e.altKey)
		&& (e.keyCode !== 17 && e.keyCode !== 18)) { // Ensure key is not ctrl or alt
		swa.plugin.clickedElements.push(e);
		Piwik.getAsyncTracker().trackLink("keypress", "event_type");
	}
	});
}

function addPluginContextToSWA(){
	
	swa.plugin = {

		// The log function is called when a page load event is logged.
		log: function() {
			swa.currentEvent="load";
			var result = swa.plugin._getCommons();
			result['element_type'] = "page";
			result['event_type'] = "load";
			result['page_load_time'] = swa.plugin._getPageLoadTime();
			result['page_content_time'] = swa.plugin._getPageContentTime();
			//FOR TESTING PURPOSES. DO NOT MODIFY COMMENT/DELETE WHEN NOT IN TEST MODE
			//@@@___@@@
			if (swa.test && typeof parent.window.swa_tests === 'function')
				parent.window.swa_tests("load",result);
			//@@@___@@@
			//END OF TEST STATEMENT
			return '&' + swa.jQuery.param(result);
		},
	
		// The link function is called if a click or hotkey event is logged.
		link: function() {
			swa.currentEvent="click";
			var pl = swa.plugin; 
			// get element from the queue that was inserted in the logging code
			var event = pl.clickedElements.shift();
			var element = swa._isUI5() ? event.target : event.currentTarget;
			var result = pl._getCommons();
			//Experimental feature for key strokes
			if (event.ctrlKey || event.altKey) {
				result['element_id'] = String.fromCharCode(event.keyCode);
				result['element_type'] = "Hotkey press";
				result['element_text'] = event.ctrlKey ? "Ctrl + "+ String.fromCharCode(event.keyCode) : "Alt + "+String.fromCharCode(event.keyCode);
				result['xpath'] = "";
				result['clickX'] = 0;
				result['clickY'] = 0;
				result['elementX'] = 0;
				result['elementY'] = 0;
				result['clickTime'] = Math.round(+new Date()/1000);
				result['elementWidth'] = 0;
				result['elementHeight'] = 0;
			} else {
				if (typeof element !== "undefined") {
					var type = element.tagName.toLowerCase();
					result['element_id'] = element.id;
					result['element_type'] = type;
					if (element.type !== "password" && !swa.jQuery(element).is(swa.textExclusionSelector)) {
						result['element_text'] = pl._getElementText(element).substring(0,varlength);
					}
					result['xpath'] = pl._getXpath(element);
					result['clickX'] = Math.round(event.pageX);
					result['clickY'] = Math.round(event.pageY);
					result['elementX'] = Math.round(swa.jQuery(element).offset().left);
					result['elementY'] = Math.round(swa.jQuery(element).offset().top);
					result['clickTime'] = Math.round(+new Date()/1000);
					result['elementWidth'] = Math.round(swa.jQuery(element).outerWidth());
					result['elementHeight'] = Math.round(swa.jQuery(element).outerHeight());
					if(type == 'a' && element.href)
						result['target_url'] = element.href;
				}
			}
			// FOR TESTING PURPOSES. DO NOT MODIFY COMMENT/DELETE WHEN NOT IN TEST MODE
			//@@@___@@@
			if (swa.test && typeof parent.window.swa_tests === 'function')
				parent.window.swa_tests("click",result);
			//@@@___@@@
			// END OF TEST STATEMENT	
			return '&' + swa.jQuery.param(result);
		},
	
		// The event function is called if a custom event has manually been triggered that should be logged.
		event: function() {
			swa.currentEvent="custom";
			var i, tmpString, result = swa.plugin._getCommons();
			result['event_type'] = "custom";
			result['element_type'] = "event";
			// The function "swa.trackCustomEvent" will store the additional values for a custom event
			// as an array (0 to 29 elements) in the swa.plugin.customEventAddValues array when called.
			// So here we take the first element from that array and loop its elements.
			var additionalValues = swa.plugin.customEventAddValues.shift();
			// Under normal circumstances "additionalValues" should never be undefined, but if someone
			// used Piwik's "trackEvent" function manually instead of SWA's "trackCustomEvent" function,
			// then there might be no array in swa.plugin.customEventAddValues, and "additionalValues"
			// would be "undefined". So we just check...
			if (typeof additionalValues !== "undefined") {
				for (i = 0; i < additionalValues.length; i++) {
					// Strip out undefined, null or empty strings
					if ((typeof additionalValues[i] !== "undefined") && (additionalValues[i] !== null)) {
						tmpString = String(additionalValues[i]).trim();
						if (tmpString.length>0) {
							// "customEventValue2" is sumbitted in URL param "e_2", "customEventValue3" is sumbitted in URL param "e_3", etc. pp.
							result["e_"+(i+2)] = tmpString;
						}
					}
				}
			}
	
	
	
			//update additional integer custom event values
			var additionalIntegerValues = swa.plugin.customEventIntAddValues.shift();
			if (typeof additionalIntegerValues !== "undefined") {
				for (i = 0; i < additionalIntegerValues.length; i++) {
					// Strip out undefined, null or empty strings
					if ((typeof additionalIntegerValues[i] !== "undefined") && (additionalIntegerValues[i] !== null)) {
						tmpString = String(additionalIntegerValues[i]).trim();
						if (tmpString.length>0) {
							// "customEventIntValue2" is sumbitted in URL param "e_int_2", "customEventIntValue3" is sumbitted in URL param "e_int_3", etc. pp.
							result["e_int_"+(i+1)] = tmpString;
						}
					}
				}
			}
			
			//Update ajax event values to the event
			var ajaxEventValues = swa.plugin.ajaxEventValues;
			if(typeof ajaxEventValues !== undefined){
				if(!!document.documentMode) //IE Support
				{
					// Strip out undefined, null or empty strings
					var values = Object.keys(ajaxEventValues).map(function(e) {
						if(ajaxEventValues[e] !== undefined && ajaxEventValues[e] !== null){
							tmpString = String(ajaxEventValues[e]).trim();
							if (tmpString.length>0) {
								result[e] = tmpString;
							}
						}
					});
				}
				else{ //Non-IE Browsers
					for(i=0; i<Object.keys(ajaxEventValues).length; i++){
						// Strip out undefined, null or empty strings
						if ((typeof Object.values(ajaxEventValues)[i] !== "undefined") && (Object.values(ajaxEventValues)[i] !== null)) {
							tmpString = String(Object.values(ajaxEventValues)[i]).trim();
							if (tmpString.length>0) {
								result[Object.keys(ajaxEventValues)[i]] = tmpString;
							}
						}
					}
				}
			}
	
	
			//FOR TESTING PURPOSES. DO NOT MODIFY COMMENT/DELETE WHEN NOT IN TEST MODE
			//@@@___@@@
			if (swa.test && typeof parent.window.swa_tests === 'function')
				parent.window.swa_tests("custom",result);
			//@@@___@@@
			//END OF TEST STATEMENT
			return '&' + swa.jQuery.param(result);
		},
	
		_getXpath: function(element) {
			var xpath = '';
			var el=element;
			for (; el && el.nodeType == 1; el = el.parentNode){
				var id = swa.jQuery(el.parentNode).children(el.tagName).index(el) + 1;
				id = id > 1 ? '[' + id + ']' : '';
				xpath = '/' + el.tagName.toLowerCase() + id + xpath;
			}
			return xpath;
		},
	
		// Build the URL parameters that should occur in any request.
		_getCommons: function() {
			var result = {
				timezone: new Date().getTimezoneOffset(),
				locale: (navigator.language ? navigator.language : navigator.browserLanguage),
				pageTitle : document.title,
				pageWidth : swa.jQuery(window).width(),
				pageHeight : swa.jQuery(window).height()
			};
			
			//Append owner information
			result.user = swa.siteOwner;
			
			// If swa object has a value for "subSiteId" then include this as param "idsitesub"
			if (typeof swa.subSiteId !== "undefined")
				result.idsitesub=swa.subSiteId;
			// Fetch custom field values 1-10
			for(var i=0;i<10;i++){
				var customid='custom'+String(i+1);         // Get name of costom field - "customX"
				var func=swa.plugin._getCustomvalues(i+1); // Get array [swa.customX.ref,swa.customX.params,swa.customX.isStatic]
				if (func===null)                           // If nothing declared for swa.customX, go to next loop iteration
					continue;
				if (typeof(func[0])==="function") {
					// ref passed is a function, we pass it on in the result array.
					//result[customid] = func[0];
					result[customid] = func[0].apply(null, func[1]);
				} else {
					// Only try to convert customX.ref to a function, if customX.isStatic is false or not set
					if (!func[2]) {
						// If ref is not a function, check if window scope has a function with the name provided
						var fn = window[func[0]];
						if (typeof fn === "function") {
							result[customid] = fn.apply(null, func[1]);
						} else {
							// We got neither a function, nor the name of a function in scope windows, so just pass on whatever it is (e.g. static string).
							result[customid] = func[0];
						}
					} else {
						// If customX.isStatic is true, don't try to convert func[0] to a function, but just pass it on
						result[customid] = func[0];
					}
				}
			}
			return result;
		},
	

		_getPageLoadTime: function(){
			
			var timing;

			if(!window.performance)
				return null;

			timing = window.performance.timing;
			
			if(!timing)
				return null;
			
			return timing.loadEventEnd - timing.requestStart;
		},

		_getPageContentTime : function(){

			var timing;

			if(!window.performance)
				return null;

			timing = window.performance.timing;
			
			if(!timing)
				return null;
			
			return timing.domContentLoadedEventEnd - timing.requestStart;
		},

		//Check if the element has TEXT content, otherwise it checks for a title or a VALUE attribute.
		_getElementText: function(element) {
			var el = swa.jQuery(element);
			if (el.text().length > 0)
				return el.text();
			return el.attr("title") ? el.attr("title") : el.val();
		},
	
		_getCustomvalues: function(id) {
			switch(id) {
				case 1: if(typeof swa.custom1==="undefined") break;
						return[swa.custom1.ref,swa.custom1.params,swa.custom1.isStatic];
				case 2: if(typeof swa.custom2==="undefined") break;
						return[swa.custom2.ref,swa.custom2.params,swa.custom2.isStatic];
				case 3: if(typeof swa.custom3==="undefined") break;
						return[swa.custom3.ref,swa.custom3.params,swa.custom3.isStatic];
				case 4: if(typeof swa.custom4==="undefined") break;
						return[swa.custom4.ref,swa.custom4.params,swa.custom4.isStatic];
				case 5: if(typeof swa.custom5==="undefined") break;
						return[swa.custom5.ref,swa.custom5.params,swa.custom5.isStatic];
				case 6: if(typeof swa.custom6==="undefined") break;
						return[swa.custom6.ref,swa.custom6.params,swa.custom6.isStatic];
				case 7: if(typeof swa.custom7==="undefined") break;
						return[swa.custom7.ref,swa.custom7.params,swa.custom7.isStatic];
				case 8: if(typeof swa.custom8==="undefined") break;
						return[swa.custom8.ref,swa.custom8.params,swa.custom8.isStatic];
				case 9: if(typeof swa.custom9==="undefined") break;
						return[swa.custom9.ref,swa.custom9.params,swa.custom9.isStatic];
				case 10: if(typeof swa.custom10==="undefined") break;
						return[swa.custom10.ref,swa.custom10.params,swa.custom10.isStatic];
				default: return null;
			}
			return null;
		},
	
		// for event targets 
		clickedElements: [],
		
		// for additional custom event values
		customEventAddValues: [],
	
		//for additional customer event values with Integer type 
		customEventIntAddValues: [],
		
		//For AJAX events
		ajaxEventValues: {}
	};
}

//Anonymize given list of properties
swa.anonymization = function (anonymCollection, reportedParams) {
	var eventMapper = getEventMapper();
	for (var prop in anonymCollection) {
		var propName = eventMapper[prop];
		if (propName != undefined)
			reportedParams[propName] = anonymCollection[prop];
	}
};

function _swaAppOnFocus(){
	swa.__validateVisitorCookie();
}

swa.__validateVisitorCookie = function() {
	if (siteProperties.visitorUUIDAnonymity) {
		var visitorInfo = Piwik.getAsyncTracker().getVisitorInfo();
		if (visitorInfo) {
			var lastVisitTimeStamp = new Date(parseInt(visitorInfo[5] + '000'));
			var createdTimeStamp = new Date(parseInt(visitorInfo[2] + '000'));
			var idleTime = (new Date() - lastVisitTimeStamp) / 1000;
			var durationSinceCreated = (new Date() - createdTimeStamp) / 1000;

			if ((idleTime >= (swa.sessionCookieTimeout - 5)) || (durationSinceCreated >= 86400)) {
				_paq.push(["deleteCookies"]); //deletes existing tracking cookies to start the new visit
			}
		}
	}
}

function getEventMapper() {
	var mapper = {};

	//Clientside properties
	mapper.eventType = "event_type";
	mapper.locale = "locale";
	mapper.pageTitle = "pageTitle";
	mapper.pageUrl = "url";
	mapper.referrer = "urlref";

	mapper.xpath = "xpath";
	mapper.domElementTag = "element_type";

	// Remove special characters from text of clicked DOM element (if there is any text)
	mapper.domElementText = "element_text";

	mapper.domElementId = "element_id";
	mapper.domElementTargetUrl = "target_url";

	//this is derived from referrer & same will be handled in server side
	//referrerDomain: String(255);*/

	//handle with "res" parameter. Format ex: 1920x1028
	//for screenWidth & screenHeight, res value should be updated. Format screenWidthxscreenHeight
	mapper.res = "res";

	//localTime is handled by h,m,s values of client
	//localTime: String(255);

	//Integer validation
	mapper.pageWidth = "pageWidth";
	mapper.pageHeight = "pageHeight";
	mapper.timezone = "timezone";
	mapper.localTimeHour = "h"; //localTime is handled by h,m,s values of client
	mapper.localTimeMinute = "m";
	mapper.localTimeSecond = "s";
	mapper.pageGenerationTime = "gt_ms";
	mapper.visitCount = "_idvc";
	mapper.clickX = "clickX";
	mapper.clickY = "clickY";
	mapper.domElementX = "elementX";
	mapper.domElementY = "elementY";
	mapper.domElementWidth = "elementWidth";
	mapper.domElementHeight = "elementHeight";
	mapper.clickTime = "clickTime"; //Validate long type

	//Boolean validation
	mapper.supportedSilverLight = "ag";
	mapper.supportedGears = "gears";
	mapper.supportedJava = "java";
	mapper.supportedFlash = "fla";
	mapper.supportedPdf = "pdf";
	mapper.supportedQt = "qt";
	mapper.supportedRealPlayer = "realp";
	mapper.supportedWma = "wma";
	mapper.supportedDirector = "dir";
	mapper.cookieEnabled = "cookie";

	return mapper;
}

swa.enable = function() {
	
	//Do not track if tracking consent is not given
	if(!siteProperties.visitorUUIDAnonymity && siteProperties.bannerEnabled && !siteProperties.hasPersonalData && (swa.getCookieValue("_swa_tracking_consent."+swa.pubToken) == null || swa.getCookieValue("_swa_tracking_consent."+swa.pubToken) != 1)){
		console.error("Visitor yet to provide tracking consent. Cannot invoke swa.enable()");
		return;
	}
	
	//If browser dnt flag is ON, do not track
	if(window.navigator.doNotTrack == "1"){
		console.error("Browser’s Do Not Track setting is ON. Cannot invoke swa.enable() by overriding browser DNT setting.");
		return;
	}
	
	//Setting loggingEnable to true explicitly to handle cases when disable() is called and then enable() again immediately
	swa.loggingEnabled = true;
	if(window.cXMLHttpRequest)
		window.cXMLHttpRequest.enableTracking = true; //Enable XHR Tracking if XMLHttpRequest is loaded and initialized (case when banner is shown and consent is given but XML File isn't loaded)
	enableHeartbeat();
	
	//Checking if piwik has been loaded.
	if (!swa.loggerLoaded) {
		swa.loadLogger();
	}
	else
		Piwik.getAsyncTracker().setDoNotTrack(false);
};


swa.disable = function() {

	swa.loggingEnabled = false;
	
	if(window.cXMLHttpRequest)
		window.cXMLHttpRequest.enableTracking = false; //Disable XHR Requests' tracking
	if(isHeartBeatEnabled){
		disableHeartbeat();
	}
};

function disableHeartbeat(){

	window.removeEventListener('focus', _swaAppOnFocus);
	_paq.push(['enableHeartBeatTimer',1800000]);
}

function checkNewVisitorCreation(){
	
	//If anonymity is set to "Do not remember", create new visitor for every event
	if(siteProperties.visitorUUIDAnonymity == 2){
		resetVisitor();
	}
	
	/**If swa banner is not used to give cookie consent, tracking is done anonymously until consent is given
	 * (or) If banner decision is deny/defer, tracking is done anonymously
	 */
	if(!swa.isCookieConsentGiven || swa.getCookieValue("_swa_visitor_cookie_consent."+swa.pubToken) == 0 || swa.getCookieValue("_swa_visitor_cookie_consent."+swa.pubToken) == 2){
		resetVisitor();
	}
}


swa.trackLoad = function () {
	
	if ((swa.loggingEnabled) && (swa.pageLoadEnabled) && (typeof Piwik !== "undefined")){
		Piwik.getAsyncTracker().trackPageView();
		Piwik.getAsyncTracker().enableJSErrorTracking();
		Piwik.enableJSErrorTracking();
	}
};

// Old manual click tracking function using (real) events
swa.trackLink = function (event) {
	
	if ((swa.loggingEnabled) && (swa.clicksEnabled) && (typeof Piwik !== "undefined")) {
		swa.plugin.clickedElements.push(event);
		Piwik.getAsyncTracker().trackLink("click", "event_type");
	}
};

// New manual click tracking function using domElement and click coordinates
swa.trackClick = function (element, x, y) {
	
	if ((swa.loggingEnabled) && (swa.clicksEnabled) && (typeof Piwik !== "undefined")) {
		var eventObj = {};
		if (typeof element !== "undefined") {
			if (swa._isUI5()) {
				eventObj.target = element;
			} else {
				eventObj.currentTarget = element;
			}
			if (typeof x !== "undefined") {
				eventObj.pageX = x;
			}
			if (typeof y !== "undefined") {
				eventObj.pageY = y;
			}
			swa.plugin.clickedElements.push(eventObj);
			Piwik.getAsyncTracker().trackLink("click", "event_type");
		}
	}
};

swa.trackCustomEvent = function (eventType, eventValue) {
	
	if (eventType == undefined || String(eventType).length === 0 || eventValue == undefined || String(eventValue).length === 0) {
		console.log("trackCustomEvent function call has invalid parameters list");
		return;
	}
	
	//If custom fields is OFF, clear the custom event values
	if(!siteProperties.hasCustomFields){
		arguments[1] = clearCustomEventValues(arguments[1]);
		arguments[2] = clearCustomEventValues(arguments[2]);
	}
	
	if ((Array.isArray(arguments[1]) && arguments[1].length > 0) || (Array.isArray(arguments[2]) && arguments[2].length > 0)) {
		if ((swa.loggingEnabled) && (swa.customEventsEnabled) && (typeof Piwik !== "undefined")) {
			var additionalStringValues = [], additionalIntValues = [], isInvalidFormat = false;
			
			//More than 3 arguments in trackCustomEvent function are being discarded if 2nd & 3rd parameters are array
			var maxStringArgs = arguments[1].length > 10 ? 10 : arguments[1].length;
			var maxIntegersArgs = arguments[2].length > 10 ? 10 : arguments[2].length;

			//update the string custom event values
			var stringCustomEventvalues = arguments[1];
			for (var i = 1; i < maxStringArgs; i++)
				additionalStringValues.push(stringCustomEventvalues[i]);

			//update the integer custom event values
			var integerCustomEventvalues = arguments[2];
			for (i = 0; i < maxIntegersArgs; i++){
				if(Number.isInteger(integerCustomEventvalues[i]) || !isNaN(parseInt(integerCustomEventvalues[i], 10))){
					additionalIntValues.push(parseInt(integerCustomEventvalues[i], 10));
				}
				else {
					isInvalidFormat = true;
					break;
				}
			}

			// Add the array "additionalStringValues" to the array "customEventAddValues" of our piwik plugin.
			// When processing the custom event in the plugin, we will add the additional values to the request.
			swa.plugin.customEventAddValues.push(additionalStringValues);

			// Add the array "additionalIntValues" to the array "customEventIntAddValues" of our piwik plugin.
			// When processing the custom event in the plugin, we will add the additional values to the request.
			swa.plugin.customEventIntAddValues.push(additionalIntValues);

			// Now send custom event using standard function "trackEvent" of Piwik.
			//if string custom values array is empty, send an event with empty string, so that if integer array exist those values will be filled without fail
			if(!isInvalidFormat && !(stringCustomEventvalues.length < 1 || stringCustomEventvalues[0] == null || stringCustomEventvalues[0] == undefined))
				Piwik.getAsyncTracker().trackEvent(eventType, stringCustomEventvalues[0]);
			else 
				console.log("Bad usage of swa.trackCustomEvent() api.  Invalid parameters used in the API");
		}
	}
	else {
		if ((swa.loggingEnabled) && (swa.customEventsEnabled) && (typeof Piwik !== "undefined")) {
			// In each function the "arguments" array always exists - even if no arguments are given (in this case arguments.length is 0).
			// If provided, eventType is arguments[0] and eventValue is arguments[1].
			// If provided, store (up to 29) additional parameters in array "additionalValues".
			// If no additional values are provided, array "additionalValues" will remain empty.
			var additionalValues = [];
			if (arguments.length > 2) {
				var maxArg = arguments.length;
				if (arguments.length > 31) maxArg = 31;
				for (i = 2; i < maxArg; i++)
					additionalValues.push(arguments[i]);
			}
			// Add the array "additionalValues" to the array "customEventAddValues" of our piwik plugin.
			// When processing the custom event in the plugin, we will add the additional values to the request.
			swa.plugin.customEventAddValues.push(additionalValues);
			// Now send custom event using standard function "trackEvent" of Piwik.
			Piwik.getAsyncTracker().trackEvent(eventType, eventValue);
		}
	}
};

function trackXHR(){
	window.addEventListener("xhr", function(event){
		if(event != null){
			//Prep a new object from "event"
			var ajaxEventValues = {"rq_m":event.detail.requestMethod, "rs_t": event.detail.responseTime, "rs_s": event.detail.responseStatus};
			swa.plugin.ajaxEventValues = ajaxEventValues;
			Piwik.getAsyncTracker().trackEvent('xhr', event.detail.requestUrl);
		}
	});
}

function clearCustomEventValues(args){
	for(var i = 0; i < args.length; i++){
		//For integer custom events, clear the integer value and make it zero
		if(Number.isInteger(args[i]))
			args[i] = 0;
		else
			args[i] = "undefined";
	}
	return args;
};

swa.getEvent = function () {
	return swa.currentEvent;
};

swa.deleteCookies = function () {
	if (typeof Piwik !== "undefined")
		Piwik.getAsyncTracker().deleteCookies(); //This deletes Piwik set cookies
	else{ //Case when piwik is not loaded yet (banner is ON and set as session is ON - this stores visitor cookie with future date and doesn't delete when a new session occurs)
		//Manually delete each cookie
		deleteSWACookies("_swa_id");
		deleteSWACookies("_swa_ref");
		deleteSWACookies("_swa_ses");
	}
	
	//Manually delete cookies set by SWA
	deleteSWACookies("_swa_tracking_consent");
};

function deleteSWACookies(cookieName){
	var validTo,exdate,cookie, cName, cookies;
	validTo = Date.now() - swa.cookieTimeoutForVisitor * 1000;
	exdate = new Date(parseInt(validTo, 10));
	
	//Delete cookie if exists
	if(swa.getCookieValue(cookieName+"." + swa.pubToken) !== null){
		cookie = cookieName+"." + swa.pubToken + "=; expires=" + exdate.toUTCString();
		cookie += "; path=/";
		document.cookie = cookie;
	}
	//Deleting cookies created by Piwik - as they have some value appended in cookie name
	else{
		cookies = document.cookie.split(";");
		for(var i=0; i<cookies.length; i++){
			if(cookies[i].trim().startsWith(cookieName)){
				cName = cookies[i].substring(0,cookies[i].indexOf("="));
				cookie = cName + "=; expires=" + exdate.toUTCString() + "; path=/";
				document.cookie = cookie;
				break;
			}
		}
	}
};


swa._addScript = function (url, callback) {
	swa.variableInit();
	callback = callback || function () { };
	var d = document, g = d.createElement('script');
	g.type = 'text/javascript'; g.defer = true; g.async = true;
	// onload() is called by Chrome, Firefox, Safari 8, Opera 30 and IE 9+
	g.onload = function () {
		try {
			callback();
		} catch (ignore) { return; }
	};

	// Required for supporting IE 8 and below.
	// onreadystatechange() is called by IE 5-10. Support has been removed in IE 11.
	g.onreadystatechange = function () {
		var userAgent = navigator.userAgent.toLowerCase();
		// IE 9 and 10 call onload(): ensure callback() is not executed twice in IE 9 and 10
		if (userAgent && userAgent.indexOf('msie 9') === -1 && userAgent.indexOf('msie 10') === -1) {
			var rs = this.readyState;
			if ((rs) && (rs === 'loaded')) {
				// In IE, 'loaded' seems to be the last state, called after multiple 'complete' states
				// This behavior is not consistent with https://msdn.microsoft.com/en-us/library/ms534359(v=vs.85).aspx
				try {
					callback();
				} catch (ignore) { return;}
			}
		}
	};
	g.src = url;
	if (d.body) {
		d.body.appendChild(g);
	} else {
		var ss = d.getElementsByTagName('script'), s = ss[ss.length - 1];
		s.parentNode.insertBefore(g, s.nextSibling);
	}
};

swa._isUI5 = function () {
	return !((typeof sap == 'undefined') || (typeof sap.ui == 'undefined'));
};

/**
 * Load eventBroadcaster for UI5 Apps and attach event listener for the same
 * @returns {void} 
 */
swa._enableUI5Events = function() {

	if(sap && sap.ui && sap.ui.core){
		
		if(sap.ui.version>="1.65.0"){
			
			sap.ui.getCore().attachInit(function () {
				sap.ui.require(["sap/ui/core/support/usage/EventBroadcaster"], function (EventBroadcaster) {
					EventBroadcaster.enable();
				});
			});
			
			attachSWAListener();
		}
		
	}

};

// -----------------------------------------------------------------------------
// Init
// -----------------------------------------------------------------------------

// This function is called after we're sure jQuery exists and
// we can go on with the init process.
swa._bootstrap = function () {
	// If someone uses old name "clickstream" instead of "swa",
	// then use jQuery to copy clickstream into swa.
	/*global clickstream*/
	if (typeof clickstream !== "undefined") {
		swa.jQuery.extend(swa, clickstream);
	}
	
	// Initialize swa
	swa.documentReady();
	
};

//look for Promise and load if not found
if (typeof Promise == "undefined") {
	loadPromise(checkJQuery);
}
else {
	checkJQuery();
}
function checkJQuery() {
	// Add jQuery to swa.jQuery
	if (typeof jQuery == "undefined") {
		// Load jQuery into swa.jQuery
		loadJQuery(swa._bootstrap);

	} else {
		/*global jQuery*/
		var jqVersion = jQuery.fn.jquery.split('.');
		if (jqVersion[0] == 3 || (jqVersion[0] == 1 && jqVersion[1] < 7)) {
			// Load jQuery into swa.jQuery if existing jQuery version is 2.x or below 1.7
			loadJQuery(swa._bootstrap);

		} else { // use existing jQuery
			swa.jQuery = jQuery;
			swa._bootstrap();
		}
	}
}

function loadPromise(callback) {
	//Load the third-party js library bluebird to support promises in IE
	swa._addScript(swa.baseUrl + "js/bluebird.min.js", function () {
		callback();
	});
}

function loadJQuery(callback) {

	swa._addScript(swa.baseUrl + "js/jquery.min.js", function () {
		swa.jQuery = jQuery.noConflict(true);
		callback();
	});
}

/**
 * EventHandler for UI5 events
 * @returns {void} 
 */
function attachSWAListener(){

	window.addEventListener("UI5Event", function(oData){

		var detail , aArgs, aTempArray;

		if(!oData)
			return;

		detail = oData.detail;
		
		if(!isUI5EventWhitelisted(detail.eventName))
			return;

		if(detail.eventName=="routeMatched"){

			//Handling duplicate loads
			if(window.location.href==loggedUrl && routeMatchedDisabled){
				
				//Setting this flag to false so the next routeMatched events will be tracked
				routeMatchedDisabled = false;

			}else{
				swa.trackLoad();
			}
				
			return;
		}	

		if(!validateUI5Event(detail.eventName, detail.targetType))
			return;

		aArgs=["UI5Event", detail.eventName, detail.targetId, detail.targetType];

		aTempArray =  getUI5ControlAdditionalAttributes(detail.eventName, detail.additionalAttributes);

		aArgs = aArgs.concat(aTempArray);

		if (window.swa) {
			window.swa.trackCustomEvent.apply(window.swa, aArgs);
		}else {
			jQuery.sap.log.warning("SWABootsrap: SWA object is not defined");
		}
	
	})
	
}

/**
 * Validating whitelisted UI5 events
 * @param {string} eventName - Event Name
 * @returns {boolean} 
 */
function isUI5EventWhitelisted(eventName){
	
	return UI5EVENTS_WHITELIST[eventName];
}

/**
 * Additional values for specific control
 * @param {string} eventName - Event Name
 * @param {object} additionalProperties 
 * @returns {Array} 
 */
function getUI5ControlAdditionalAttributes(eventName, additionalProperties){
	
	switch(eventName) {
		case "selectionChange":
		case "change":
		return getSelectProperties(additionalProperties);
		case "search":
		return getSearchEventProperties(additionalProperties);
		default:
		return [];
	}
}

/**
 * Get selected item properties
 * @param {object} additionalProperties 
 * @returns {Array} 
 */
function getSelectProperties(additionalProperties){
	
	if(additionalProperties.selectedItem){
		return [additionalProperties.selectedItem.getKey(),additionalProperties.selectedItem.getText()];
	}

}

function getSearchEventProperties(additionalProperties){
	
	if(additionalProperties.query){
		return [additionalProperties.query];
	}
}


/**
 * Whitelisting specified events
 * @returns {void} 
 */
function whiteListUI5Events(){
	
	UI5EVENTS_WHITELIST.selectionChange = ["sap.m.ComboBox"];
	UI5EVENTS_WHITELIST.change = ["sap.m.Select"];
	UI5EVENTS_WHITELIST.search = ["sap.m.SearchField"]
		
}

/**
 * Validating event type
 * @param {string} eventName - Event Name
 * @param {string} control - Event Control
 * @returns {boolean} 
 */
function validateUI5Event(eventName, control){

	var	i ,controls = UI5EVENTS_WHITELIST[eventName];

	for (i in controls) {
		if(controls[i]==control)
			return true;
	}

	return true;

}
/**
 * Function to get the tracking status
 */
swa.getTrackingStatus = function() {

	
	return swa.loggingEnabled;

}


addConsentForm = function () {	
	if (swa.jQuery('#swa_consentform').length === 0) {	
		swa.jQuery('body').append('<style> #swa_background {    position: fixed;    top: 0px;    left: 0px;    height: 100%;    width: 100%;    display: none;    background-color: black;    z-index: 9999;}#swa_consentform {  font-family: Arial, Helvetica, sans-serif;    background-color: white;    color: black;        position: fixed;  z-index: 11100; width: 100%;  max-width: 520px; left: 0 !important; right: 0 !important; margin: auto; padding:10px; background: #FFF;    border-radius: 5px;    -moz-border-radius: 5px;    -webkit-border-radius: 5px;    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.7);    -webkit-box-shadow: 0 0 4px rgba(0, 0, 0, 0.7);    -moz-box-shadow: 0 0px 4px rgba(0, 0, 0, 0.7);}.close_swaconsent {    position: absolute;    top: 0px;    right: 12px;    display: block;    width: 16px;    height: 15px;	    z-index: 2;	}.swaconsentbutton { background-color: #458bc5 ; color: #ffffff; float: right;    font-size: 16px;	margin: 0%	cursor: pointer; 	border-style: none;	height: 8% ;    width: inherit;	padding : 4px 12px;  	margin-right:15px;}#swa_form{    border-top: 1px solid #808082;	padding: 1% 0%;}.headcenter{text-align: center;font-family:sans-serif;}.textfix{ font-family: sans-serif	;font-size: 13px;    -webkit-margin-start: 3%;    -webkit-margin-end: 3%;}</style><div id="swa_background"></div>  <div id="swa_consentform" style="top:40px">         <a  href="#" onclick="banner_save(event); return false"> <img id="closeButton" class="close_swaconsent" onclick="banner_save(event); return false;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAACIiIhaeOqmAAAAAXRSTlMAQObYZgAAAC9JREFUaN5jYGBgEOBgsJBhqLFjsKthkP/BwP+Bgf0BCAEZQC5QECgFVABUxsAAAOcxCbuaDAybAAAAAElFTkSuQmCC" /><hr />   </a> 	<div id="swa_consent_text_window" class="swalicensetxt" ><div> 	<p> <strong>This site uses SAP Web Analytics to analyze how users use this site. The information generated (including a part of your IP address and a browser ID) will be transmitted to and stored by SAP on its servers. Cookies are used to identify your repeat visit and your visit origin page. We will use this information only for the purpose of evaluating website usage and compiling reports on website activity for website operators - and finally, to improve  the site.&nbsp;If you would like to opt-in for SAP Web Analytics tracking, please specify your preference using the "Allow" button below. By opt-in, you consent to the processing of analytics data about you in the manner and for the purposes set out above.</strong></p>	</div>    <div id="swa_form">	        <button class="swaconsentbutton" type="button" id="swaconsent_notnow_modal"  onclick="banner_save(event); return false;">Deny</Button>  <button class="swaconsentbutton" type="button" id="swaconsent_allow_modal"  onclick="banner_save(event); return false;">Allow</button> </div></div></div>');


		swa.jQuery('#swa_background, .close_swaconsent').click(function (event) {	
			removeConsentForm();	
			event.preventDefault();	
		});	
	}	
}	

removeConsentForm = function () {	
	swa.jQuery('#swa_background').fadeOut(500);	
	swa.jQuery('#swa_consentform').fadeOut(500);	
}	

removeOptoutConsentForm = function () {	
	swa.jQuery('#swa_background_optout').fadeOut(500);	
	swa.jQuery('#swa_optout_consentform').fadeOut(500);	
}	

showConsentForm = function (calledOnDemand) {	

	//swa.clearConsentDeferDecision();	

	addConsentForm();	

	/*Attaching a listener on esc key press to close the consent form	
	* Creates consent_defer cookie so the form is not shown until next session 	
	*/	
	document.onkeydown = function(event){	
		if(event.keyCode == 27){	
			swa.jQuery('#swa_background').fadeOut(500);	
			swa.jQuery('#swa_consentform').fadeOut(500);		
		}	
	}	

	var wheight = swa.jQuery(window).height();	
	var wwidth = swa.jQuery(window).width();	
	var mheight = swa.jQuery('#swa_consentform').outerHeight();	
	var mwidth = swa.jQuery('#swa_consentform').outerWidth();	
	swa.jQuery('#swa_consentform').css({ 'top': top, 'left': left })
	swa.jQuery('#swa_background').css({ 'display': 'block', opacity: 0 })
	var top = (wheight - mheight) / 2;	
	var left = (wwidth - mwidth) / 2;

	//Show pop up when called on demand
	if(!calledOnDemand){
		swa.jQuery('#swa_consentform').hide();	
		swa.jQuery('#swa_background').hide();
	}
	else{
		swa.jQuery('#swa_background').fadeTo(500, 0.8);	
		swa.jQuery('#swa_consentform').fadeIn(500);	
	}

}	

swa.showConsentFormOnDemand = function(){
	//sites using SWA banner are only allowed to use this
	if(siteProperties.bannerEnabled && !swa.isConsentGiven){
	//check the client side consentStyle and on load properties   
	if(  swa.loggingEnabled  ){
		//Show Consent Opt out
		showOptoutConsentForm();
	}else if(!swa.loggingEnabled  ){
		//show consent optin form
		if(swa.consentStyle =="popup" ){
			//show consent pop up
			showConsentForm(true);
		}else if(swa.consentStyle =="banner" ){
		if (swa.jQuery('div[swa_banner=1]').length === 0) {

			swa.jQuery('body').append('<style>.swa_banner {font-family:Arial,Helvetica,sans-serif;width: 100%;height: auto;min-height: 20px;background-color: #FFFFFF;z-index: 9999;position: absolute;left: 0;top: 0;font-size:80%; padding: 10px 10px 10px 10px;}.swa_banner p {display: inline;position: static;left: 0px; word-spacing:1px;line-height: 17px;}.swa_banner img{vertical-align:top;}.swa_banner form {display: inline;position: absolute;right: 0px;margin-right: 25px;}#buttonsDiv{float: right;margin-right:30px;padding: 5px 5px 0 0;}.bannerButton {margin-right:15px;background-color: #0066ff;border: none;color: white;padding:5px 5px;font-size: 12px;cursor: pointer;width: 60px;border-radius:4px;}.bannerButton:hover{background-color: #075caf;} button#yesButton:disabled { opacity: 0.3; background-color:#0066ff}</style><div id="swa_banner" class="swa_banner"><p><strong>This site uses SAP Web Analytics to analyze how users use this site. The information generated (including a part of your IP address and a browser ID) will be transmitted to and stored by SAP on its servers. Cookies are used to identify your repeat visit and your visit origin page. We will use this information only for the purpose of evaluating website usage and compiling reports on website activity for website operators - and finally, to improve  the site\n.	If you would like to opt-in for SAP Web Analytics tracking, please specify your preference using the "Allow" button below. By opt-in, you consent to the processing of analytics data about you in the manner and for the purposes set out above.</strong></p></br><hr><div id="buttonsDiv" ><button type="button" id="yesButton" class = "bannerButton" onclick="banner_save(event); return false;">Allow</button><button type="button" class = "bannerButton" id="noButton" onclick="banner_save(event); return false;">Deny</button><a href="#" title="Close" style="margin-top:5px; margin-left:20px;" onclick="banner_save(event); return false;"><img id="closeButton" onclick="banner_save(event); return false;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAACIiIhaeOqmAAAAAXRSTlMAQObYZgAAAC9JREFUaN5jYGBgEOBgsJBhqLFjsKthkP/BwP+Bgf0BCAEZQC5QECgFVABUxsAAAOcxCbuaDAybAAAAAElFTkSuQmCC" /></a></div>');          
	    }
		//swa.jQuery('.banner').hide();
		}
		
	}
}else{
	console.error("Can only be used for sites using Web analytics banner");
}
			
	
}
function showOptoutConsentForm(){
	if(swa.consentStyle =="popup" ){
		//show opt out consent pop up
		addOptOutConsentForm();
	}else {
		
	if (swa.jQuery('div[optoutbanner=1]').length === 0) {

		swa.jQuery('body').append('<style>.optoutbanner {font-family:Arial,Helvetica,sans-serif;width: 100%;height: auto;min-height: 20px;background-color: #FFFFFF;z-index: 9999;position: absolute;left: 0;top: 0;font-size:80%; padding: 10px 10px 10px 10px;}.optoutbanner p {display: inline;position: static;left: 0px; word-spacing:1px;line-height: 17px;}.optoutbanner img{vertical-align:top;}.optoutbanner form {display: inline;position: absolute;right: 0px;margin-right: 25px;}#buttonsDiv{float: right;margin-right:30px;padding: 5px 5px 0 0;}.bannerButton {margin-right:15px;background-color: #0066ff;border: none;color: white;padding:5px 5px;font-size: 12px;cursor: pointer;width: 100px;border-radius:4px;}.bannerButton:hover{background-color:#075caf;} button#yesButton:disabled { opacity: 0.3; background-color:#0066ff }</style><div id="swa_optout_banner" class="optoutbanner"><p><strong>This site uses SAP Web Analytics to analyze how users use the site. Based on your prior consent, a cookie is persisted in the browser of your device to identify your repeat visits and your visit origin page. This information is used solely for the purpose of evaluating website usage and to further improve the site. If you would like to revoke your tracking consent, please specify your preference using the "Stop Tracking" button below.</strong> </p></br><hr><div id="buttonsDiv" ><button type="button" class = "bannerButton" id="noButton" onclick="stopTracking(); return false;">Stop Tracking</button><a href="#" title="Close" style="margin-top:5px; margin-left:20px;" onclick="closeForm(); return false;"><img id="closeButton" onclick="closeForm(); return false;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAACIiIhaeOqmAAAAAXRSTlMAQObYZgAAAC9JREFUaN5jYGBgEOBgsJBhqLFjsKthkP/BwP+Bgf0BCAEZQC5QECgFVABUxsAAAOcxCbuaDAybAAAAAElFTkSuQmCC" /></a></div>');          
    }
	
	}
}

function addOptOutConsentForm() {
	
	if (swa.jQuery('#swa_optout_consentform').length === 0) {	

		swa.jQuery('body').append('<style> #swa_background_optout {    position: fixed;    top: 0px;    left: 0px;    height: 100%;    width: 100%;    display: none;    background-color: black;    z-index: 100;}#swa_optout_consentform {  font-family: Arial, Helvetica, sans-serif;    background-color: white;    color: black;    border: 1px solid gray;    position: fixed;  z-index: 11100; width: 100%;  max-width: 520px; left: 0 !important; right: 0 !important; margin: auto; padding:10px; background: #FFF;    border-radius: 5px;    -moz-border-radius: 5px;    -webkit-border-radius: 5px;    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.7);    -webkit-box-shadow: 0 0 4px rgba(0, 0, 0, 0.7);    -moz-box-shadow: 0 0px 4px rgba(0, 0, 0, 0.7);}.close_swaoptoutconsent {    position: absolute;    top: 0px;    right: 12px;    display: block;    width: 16px;    height: 15px;	    z-index: 2;	}.swaconsentbutton { background-color: #458bc5 ; color: #ffffff; float: right;    font-size: 16px;	margin: 0%	cursor: pointer; 	border-style: none;	height: 8% ;    width: inherit;	padding : 4px 12px;  -webkit-border-radius: 4px;	}.swaconsentbutton3{	float: right;  display: inline; color:#346187; background-color: #ffffff; 	font-size: 13px;    margin: 0% 4%;	border-style: none;	height: 8%;    width: inherit;	padding:1%;}#swa_form1{    border-top: 1px solid #808082;	padding: 1% 0%;}.headcenter{text-align: center;font-family:sans-serif;}.textfix{ font-family: sans-serif	;font-size: 13px;    -webkit-margin-start: 3%;    -webkit-margin-end: 3%;}</style><div id="swa_background_optout"></div>  <div id="swa_optout_consentform">        <a class="close_swaopoutconsent" href="#"> <img id="closeButton" class="close_swaoptoutconsent" onclick="closeForm(); return false;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAACIiIhaeOqmAAAAAXRSTlMAQObYZgAAAC9JREFUaN5jYGBgEOBgsJBhqLFjsKthkP/BwP+Bgf0BCAEZQC5QECgFVABUxsAAAOcxCbuaDAybAAAAAElFTkSuQmCC" /><hr />  </a>  	<div id="swa_consent_text_window1" class="swalicensetxt" >	<div> 	<p><strong>This site uses SAP Web Analytics to analyze how users use the site. Based on your prior consent, a cookie is persisted in the browser of your device to identify your repeat visits and your visit origin page. This information is used solely for the purpose of evaluating website usage and to further improve the site. &nbsp;If you would like to revoke your tracking consent, please specify your preference using the "Stop Tracking" button below.</strong></p>	</div>    <div id="swa_form1">	   <button class="swaconsentbutton" type="button" id="swaconsent_notnow_modal"  onclick="stopTracking();">Stop Tracking</Button>        </div></div></div>');	
	}
	swa.jQuery('#swa_background_optout, .close_swaconsent').click(function (event) {	
		removeOptoutConsentForm();	
		event.preventDefault();	
	});	
	document.onkeydown = function(event){	
		if(event.keyCode == 27){	
			swa.jQuery('#swa_background_optout').fadeOut(500);	
			swa.jQuery('#swa_optout_consentform').fadeOut(500);		
		}	
	}	
	var wheight = swa.jQuery(window).height();	
	var wwidth = swa.jQuery(window).width();	
	var mheight = swa.jQuery('#swa_optout_consentform').outerHeight();	
	var mwidth = swa.jQuery('#swa_optout_consentform').outerWidth();	
	var top = (wheight - mheight) / 2;	
	var left = (wwidth - mwidth) / 2;	
	swa.jQuery('#swa_optout_consentform').css({ 'top': top, 'left': left });	
	swa.jQuery('#swa_background_optout').css({ 'display': 'block', opacity: 0 });	
	swa.jQuery('#swa_background_optout').fadeTo(500, 0.8);	
	swa.jQuery('#swa_optout_consentform').fadeIn(500);	
	
}
function closeForm(){
	
	//Close the banner or pop up
	if(swa.consentStyle =="banner")
	swa.jQuery('.optoutbanner').slideUp();	
	else{
		swa.jQuery('#swa_optout_consentform').slideUp();	
		removeOptoutConsentForm();
	}
}

function stopTracking(){
	swa.disable();
	createSWACookie("tracking_consent", 0);
	closeForm();
}


