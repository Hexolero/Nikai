// converters
var number_to_kanji = {"1":"一","2":"二","3":"三","4":"四","5":"五","6":"六","7":"七","8":"八","9":"九"};
var kanji_to_number = {"一":"1","二":"2","三":"3","四":"4","五":"5","六":"6","七":"7","八":"8","九":"9"};

// numbers (all up to 10^13 - 1 (9999999999999) are covered)
var ctr_number = 	{"1":["いち"], "2":["に"], "3":["さん"], "4":["よん", "し"], "5":["ご"], "6":["ろく"], "7":["なな", "しち"], "8":["はち"], "9":["きゅう"],
					 "10":["じゅう"], "100":["ひゃく"], "1000":["せん"], "10000":["まん"], "100000":["じゅうまん"], "1000000":["ひゃくまん"], "10000000":["せんまん"],
					 "100000000":["おく"], "1000000000":["じゅうおく"], "10000000000":["ひゃくおく"], "":[""], "":[""], "":[""], "":[""],};
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

$(document).ready(function() {
	$("#kana-input").on("keypress", function(e) {
		if(e.which == 13) {
			//$(this).attr("disabled", "disabled");
			//$(this).val(ctr_number[$(this).val()]);
			
			$(this).val(getAllPossibleStrings($(this).val())[0]);
		}
	});
});

function getAllPossibleStrings(number) {
	// number is between 1 and 10^13 - 1. separate into ABCD * 10^0, DEFG * 10^4, HIJK * 10^8, 000L * 10^12 and concatenate strings found separately
	if(number < 1 || number > 9999999999999)
		return [""]; // empty string when number is outside of range
	number = number.toString();
	
	// section for ABCD * 10^0
	var string_power0 = []; // possible strings
	var ABCD;
	if(number.length <= 4) // number < 10^4 - we can treat it as the string to check
		ABCD = number;
	else // number >= 10^4 - we need to take a substring
		ABCD = number.substr(number.length - 4, 4);
	// ABCD is now a string of length 4 (or less)
	ABCD = parseInt(ABCD).toString(); // this removes left-side zeros from the string, potentially lowering the length of the string
	if(ABCD in ctr_number_exceptions_0)
		string_power0 = ctr_number_exceptions_0[ABCD]; // our string was exactly one of the exceptions
	else {
		// work on each individual digit
		var tempString;
		var ABCDpossibleStrings = []; // will be a double array
		for(i = 1; i <= ABCD.length; i++) {
			tempString = substrIsolateK(ABCD, i); // now of the form D, C0, B00, A000
			if(tempString.charAt(0) == '0') {
				ABCDpossibleStrings[i] = [""]; // empty string, not empty array.
				continue; // we don't read digits that are 0 to the left of a decimal point
			}
			
			// lookup isolated digit in 10^0 exception array
			if(tempString in ctr_number_exceptions_0) {
				ABCDpossibleStrings[i] = ctr_number_exceptions_0[tempString];
			}
			else {
				// have to add it manually
				var digitOptions;
				var magnitudeOptions
				if(i == 1 /* and power of 10 is 0 */)
					digitOptions = ctr_number[parseInt(tempString)]; // use both readings for 4 and 7
				else {
					digitOptions = parseInt(tempString) / Math.pow(10, i - 1);
					digitOptions = [ctr_number[digitOptions][0]]; // use only the first reading for digits greater than 10^0
				}
				magnitudeOptions = ctr_number[(Math.pow(10, i - 1)).toString()];
				// digitOptions contains reading(s) for the digit, magnitudeOptions contains reading(s) for the magnitude of 10
				// if i == 1 we don't want to append いち e.g. さんいち so we skip "cross multiplying" and just return digit options
				if(i == 1)
					ABCDpossibleStrings[i] = digitOptions;
				else {
					var crossArr = [];
					for(d in digitOptions)
						for(m in magnitudeOptions)
							crossArr.push(digitOptions[d] + magnitudeOptions[m]);
					ABCDpossibleStrings[i] = crossArr;
				}
			}
		}
		// ABCDpossibleStrings now has the possible strings for the first digit up to potentially the fourth digit as subarrays
		// we have to concat these in all possible combinations (keeping digit order)
		var concat = [];
		switch(ABCDpossibleStrings.length - 1) { // since we 1-indexed, .length returns 2 if we only have 1 digit, etc.
			case 1: // single digit
				string_power0 = ABCDpossibleStrings[1];
				break;
			case 2: // 2 digits
				for(d in ABCDpossibleStrings[1]) {
					for(c in ABCDpossibleStrings[2]) {
						concat.push(ABCDpossibleStrings[2][c] + ABCDpossibleStrings[1][d]);
					}
				}
				string_power0 = concat;
				break;
			case 3: // 3 digits
				for(d in ABCDpossibleStrings[1]) {
					for(c in ABCDpossibleStrings[2]) {
						for(b in ABCDpossibleStrings[3]) {
							concat.push(ABCDpossibleStrings[3][b] + ABCDpossibleStrings[2][c] + ABCDpossibleStrings[1][d]);
						}
					}
				}
				string_power0 = concat;
				break;
			case 4: // all 4 digits
				for(d in ABCDpossibleStrings[1]) {
					for(c in ABCDpossibleStrings[2]) {
						for(b in ABCDpossibleStrings[3]) {
							for(a in ABCDpossibleStrings[4]) {
								concat.push(ABCDpossibleStrings[4][a] + ABCDpossibleStrings[3][b] + ABCDpossibleStrings[2][c] + ABCDpossibleStrings[1][d]);
							}
						}
					}
				}
				string_power0 = concat;
				break;
			default:
				string_power0 = [];
				break;
		}
	}
	return string_power0;
	// section for DEFG * 10^4
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

//	process for checking correct input for counters:
//	-- Magnitudes of 10 for japanese numbering system are: 10^0, 10^1, 10^2, 10^3, 10^4, 10^8, 10^12.
//	1. figure out smallest nonzero magnitude of 10, this is tied to the counter. anything larger is read just like a number
//	2. look up reading for counter with the multiple of this smallest nonzero magnitude of 10, this is the rightmost portion of the final string
//	3. subtract this number from the displayed number so that the next largest power of 10 is the first nonzero one
//	4. put this new number through the process for finding equivalent string for *counting numbers* (guaranteed to be >= 10 since we subtracted off the smallest magnitude of 10)
//	5. the string from part 2. is affixed to the end of this string and compared against user input

//	process for checking correct input for counting numbers:
//	