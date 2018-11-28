// converters
var number_to_kanji = {"1":"一","2":"二","3":"三","4":"四","5":"五","6":"六","7":"七","8":"八","9":"九"};
var kanji_to_number = {"一":"1","二":"2","三":"3","四":"4","五":"5","六":"6","七":"7","八":"8","九":"9"};

// numbers (all up to 10^13 - 1 (9999999999999) are covered)
var ctr_number = 	{"1":["いち"], "2":["に"], "3":["さん"], "4":["よん", "し"], "5":["ご"], "6":["ろく"], "7":["なな", "しち"], "8":["はち"], "9":["きゅう"],
					 "10":["じゅう"], "100":["ひゃく"], "1000":["せん"], "10000":["まん"], "100000000":["おく"], "1000000000000":["ちょう"]};
// these arrays contain *specific number exceptions* e.g. 300 = さんびゃく and not さんひゃく
// 1 <= n < 10^4
var ctr_number_exceptions_0 = {"10":["じゅう"], "100":["ひゃく"], "300":["さんびゃく"], "600":["ろっぴゃく"], "800":["はっぴゃく"], "1000":["せん", "いっせん"], "3000":["さんぜん"], "8000":["はっせん"]};
// 10^4 <= n < 10^8
var ctr_number_exceptions_4 = {"10000":["いちまん"]};
// 10^8 <= n < 10^12
var ctr_number_exceptions_8 = {"100000000":["いちおく"]};
// 10^12 <= n < 10^13 - 1
var ctr_number_exceptions_12 = {"1000000000000":["いっちょう"], "8000000000000":["はっちょう"]};

// 回
var ctr_times = {};

// 日
var ctr_days = {};

//
var current_ctr_number = 2;
var current_ctr_display = "二回";
var current_ctr_types = {number:true, times:true, days:false};

// consts
const HINT_TEXT = "Reading (Hover)";

$(document).ready(function() {
	$("#kana-input").on("keypress", function(e) {
		if(e.which == 13) {
			// user has entered input
			var userInput = parseInt($(this).val());
			
			$(this).val(getReadings($(this).val()));
		}
	});
	
	$("#hint-text").hover(function() {
		// display the reading of the current counter
		$(this).html("にかい");
	}, function() {
		// return to the default text
		$(this).html(HINT_TEXT);
	});
	
	$('[data-toggle="popover"]').popover(); // enable popovers in entire document
});

function getReadings(number) {
	if(number < 1 || number > 9999999999999) {
		window.alert("bad argument to getReadings(number), outside of allowed range. number: " + number);
		return [""];
	}
	// number is between 1 and 10^13 - 1, need to split it into 10^12, 10^8, 10^4 and 10^0 cases
	number = number.toString(); // now length of number indicates what powers of 10 are present, can be between 1 and 13
	
	var power_readings = []; // will be double array
	
	var digits = parseInt(number.slice(-4)).toString(); // 10^0 4 digits, guaranteed to have length >= 1
	if(digits != "0")
		power_readings[0] = getReadings10k(digits);
	else
		power_readings[0] = [""];
	
	digits = parseInt(number.slice(-8)).toString();
	if(digits in ctr_number_exceptions_4) // first check if number is a 10^4 exception
		power_readings[1] = ctr_number_exceptions_4[digits];
	else if(parseInt(digits) < 10000)
		power_readings[1] = [""];
	else {
		// otherwise, need to check length and get 10k readings, then suffix all with 10^4 (まん)
		digits = digits.slice(0, digits.length - 4); // take only leftmost digits
		if(digits.length > 0) {
			power_readings[1] = getReadings10k(parseInt(digits));
			for(r in power_readings[1])
				power_readings[1][r] = power_readings[1][r] + ctr_number["10000"];
		}
		else
			power_readings[1] = [""];
	}
	
	digits = parseInt(number.slice(-12)).toString();
	if(digits in ctr_number_exceptions_8)
		power_readings[2] = ctr_number_exceptions_8[digits];
	else if(parseInt(digits) < 100000000)
		power_readings[2] = [""];
	else {
		// check length and get 10k readings, suffix all with 10^8 (おく)
		digits = digits.slice(0, digits.length - 8);
		if(digits.length > 0) {
			power_readings[2] = getReadings10k(parseInt(digits));
			for(r in power_readings[2])
				power_readings[2][r] = power_readings[2][r] + ctr_number["100000000"];
		}
		else
			power_readings[2] = [""];
	}
	
	digits = parseInt(number.slice(-16)).toString();
	if(digits in ctr_number_exceptions_12)
		power_readings[3] = ctr_number_exceptions_12[digits];
	else if(parseInt(digits) < 1000000000000)
		power_readings[3] = [""];
	else {
		// check length and get 10k readings, suffix all with 10^12 (ちょう)
		digits = digits.slice(0, digits.length - 12);
		if(digits.length > 0) {
			power_readings[3] = getReadings10k(parseInt(digits));
			for(r in power_readings[3])
				power_readings[3][r] = power_readings[3][r] + ctr_number["1000000000000"];
		}
		else
			power_readings[3] = [""];
	}
	
	// power_readings now contains all individual readings, concat-multiply to get possible results
	var readings = [];
	for(r12 in power_readings[3])
		for(r8 in power_readings[2])
			for(r4 in power_readings[1])
				for(r0 in power_readings[0])
					readings.push(power_readings[3][r12] + power_readings[2][r8] + power_readings[1][r4] + power_readings[0][r0]);
	return readings;
}

function getReadings10k(number) {
	if(number < 1 || number > 9999) {
		window.alert("bad argument to getReadings10k(number), outside of allowed range. number: " + number);
		return [""];
	}
	number = number.toString();
	// we know number < 10^4, so we treat it as the string to check (has length <= 4)
	number = parseInt(number).toString(); // remove leftside zeros from the string
	if(number in ctr_number_exceptions_0)
		return ctr_number_exceptions_0[number]; // our string was precisely an exception
	// do work on each individual digit
	var isolatedPower;
	var ABCDpossibleStrings = []; // will be a double array containing possible readings for D, C0, B00, A000 isolated powers
	for(i = 1; i <= number.length; i++) {
		isolatedPower = substrIsolateK(number, i); // now of the form D, C0, B00, A000
		if(isolatedPower.charAt(0) == '0') {
			ABCDpossibleStrings[i - 1] = [""]; // empty string, not empty array
			continue; // don't read digits which are 0 to the left of the decimal point
		}
		// look up isolated digit in 10^0 exception array
		if(isolatedPower in ctr_number_exceptions_0) {
			ABCDpossibleStrings[i - 1] = ctr_number_exceptions_0[isolatedPower];
			continue;
		}
		// now have to add the digit manually / by process
		if(i == 1)
			ABCDpossibleStrings[i - 1] = ctr_number[parseInt(isolatedPower)]; // reading for digit by itself
		else {
			// "multiply" options for digit by options for magnitude to produce all possibilities
			var crossArr = [];
			var digitOptions = [ctr_number[parseInt(isolatedPower) / Math.pow(10, i - 1)][0]]; // only use the most common reading when the digit position isn't 1
			var magnitudeOptions = ctr_number[(Math.pow(10, i - 1)).toString()];
			for(d in digitOptions)
				for(m in magnitudeOptions)
					crossArr.push(digitOptions[d] + magnitudeOptions[m]);
			ABCDpossibleStrings[i - 1] = crossArr;
		}
	}
	// ABCDpossibleStrings now contains the possible strings for digits [0] = D, [1] = C, [2] = B, [3] = A, if they exist. digit D is guaranteed to exist since number >= 1
	// to guarantee we can loop through all of them, we extend ABCDpossibleStrings with [""] until all 4 digits are accounted for
	while(ABCDpossibleStrings.length < 4)
		ABCDpossibleStrings.push([""]);
	var possible_strings = []; // we'll concat all strings into here
	for(var a in ABCDpossibleStrings[3])
		for(var b in ABCDpossibleStrings[2])
			for(var c in ABCDpossibleStrings[1])
				for(var d in ABCDpossibleStrings[0])
					possible_strings.push(ABCDpossibleStrings[3][a] + ABCDpossibleStrings[2][b] + ABCDpossibleStrings[1][c] + ABCDpossibleStrings[0][d]);
	return possible_strings;
}

// helper functions
function substrLastK(string_input, k) {
	return string_input.substr(string_input.length - k, k);
}
function substrIsolateK(string_input, k) {
	// assume k < string_input.length, e.g. string is 5106017 and k=2, we want to return 10
	string_input = string_input.substr(string_input.length - k, 1);
	while(string_input.length < k)
		string_input = string_input + "0"; // pad end of string with zeros until desired length is reached
	return string_input;
}