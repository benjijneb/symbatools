'use strict'

var symbaroum = angular.module('symbaroum', ['ngRoute', 'routeAppControllers', 'pascalprecht.translate', 'ngSanitize']);

symbaroum.config(['$translateProvider', function ($translateProvider) {
	// add translation tables
	$translateProvider.translations('en', translationsEN);
	$translateProvider.translations('fr', translationsFR);
	$translateProvider.translations('es', translationsES);
	$translateProvider.determinePreferredLanguage();
	
	$translateProvider.registerAvailableLanguageKeys(['fr', 'en', 'es', '*'], {
		'fr_*': 'fr',
		'en_*': 'en',
		'es_*': 'es',
		'*': 'en'
	  });
}]);

symbaroum.config(['$routeProvider',
	function ($routeProvider) {

		// Système de routage
		$routeProvider
			.when('/rules', {
				templateUrl: 'rules.html'
			})
			.when('/search', {
				templateUrl: 'recherche.html',
				controller: 'Recherche'
			})
			.when('/davokar', {
				templateUrl: 'davokar.html',
				controller: 'Davokar'
			})
			.when('/init', {
				templateUrl: 'init.html',
				controller: 'Init'
			})
			.when('/ext', {
				templateUrl: 'externalLinks.html'
			})
			.when('/help', {
				templateUrl: 'help.html',
				controller: 'Help'
			})
			.when('/statblock', {
				templateUrl: 'statBlock.html',
				controller: 'Recherche'
			})
			.when('/lostPwd', {
				templateUrl: 'lostPwd.html',
				controller: 'LostPwd'
			})
			.otherwise({
				redirectTo: '/search'
			});
	}
]);

// Function to download data to a file
function download(data, filename, type) {

	var file = new Blob([data], { type: type });
	if (window.navigator.msSaveOrOpenBlob) // IE10+
		window.navigator.msSaveOrOpenBlob(file, filename);
	else { // Others
		var a = document.createElement("a"),
			url = URL.createObjectURL(file);
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(function () {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0);
	}
}

symbaroum.filter('rechercheFilter', function () {

	return function (items, query) {

		var filtered = {};

		if ((!(query.nom === "") && !(query.nom === undefined)) || query.epingleSeulement || !(query.filtreType === "tous" && query.filtreLivre === "tous" && query.filtreTrad === "tous" && query.filtreAttr === "tous")) {

			for (var keyName in items) {
				
				if (items[keyName].epingle || items[keyName].epinglen || items[keyName].epinglea || items[keyName].epinglem) {

					filtered[keyName] = items[keyName];
				} else if (!query.epingleSeulement) {

					var tokens = query.nom.toLowerCase().split(",");
					tokens.forEach(function (item) {
						
						item = item.trim();
						if ((items[keyName].nom.toLowerCase().includes(item) || item === "")
							&& ((items[keyName].type.split("/").includes(query.filtreType)) || query.filtreType === "tous")
							&& ((query.filtreLivre === items[keyName].livre) || query.filtreLivre === "tous")
							&& ((items[keyName].tradition && items[keyName].tradition.toLowerCase().includes(query.filtreTrad)) || query.filtreTrad === "tous" || (query.filtreTrad === "aucune" && !items[keyName].tradition))
							&& ((items[keyName].attribut && items[keyName].attribut.split(",").includes(query.filtreAttr)) || query.filtreAttr === "tous")) {

							
							if (!filtered[keyName]) { filtered[keyName] = items[keyName]; }
						}
					});
				}
			}
		} else {
			return items;
		}

		return filtered;
	};
});

symbaroum.directive('onReadFile', function ($parse) {
	
	return {
		restrict: 'A',
		scope: false,
		link: function (scope, element, attrs) {
			var fn = $parse(attrs.onReadFile);

			element.on('change', function (onChangeEvent) {
				var reader = new FileReader();

				reader.onload = function (onLoadEvent) {
					scope.$apply(function () {
						fn(scope, { $fileContent: onLoadEvent.target.result });
					});
				};

				reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
			});
		}
	};
});

symbaroum.factory('globalService', function () {

	return {
		encoding: function (data, route) {

			var compressed = window.btoa(escape(LZString.compress(JSON.stringify(data))));
			return window.location.origin + window.location.pathname
				+ "#!/" + route + "?b64=" + compressed;
		},
		decoding: function (data) {

			var uncompressed = LZString.decompress(unescape(window.atob(data)));
			return uncompressed;
		}
	};
});

symbaroum.factory('auth', function() {
	
	var authenticationService = {};

    authenticationService.username;
	authenticationService.authenticated = false;

	authenticationService.isAuthenticated = function() {
		
		return authenticationService.authenticated;
	}

    return authenticationService;
});

var routeAppControllers = angular.module('routeAppControllers', []);

routeAppControllers.controller('Index', function ($scope, $rootScope, $translate, $http, auth) {

	$scope.isAuthenticated = auth.isAuthenticated;

	$scope.pwdPattern = "(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}";
	$scope.everythingPattern = ".*";

	$rootScope.theme = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? 'dark' : 'std';

	if ($translate.use().includes('fr')) {

		$rootScope.lang = 'fr';
	} else if ($translate.use().includes('es')) {

		$rootScope.lang = 'es';
	} else {

		$rootScope.lang = 'en';
	}

	$scope.$watch('theme', function(value) {

		if (value != undefined) {
			$rootScope.theme = value;
		}
	});

	$scope.changeLanguage = function (langKey) {

		$rootScope.lang = langKey;
		$translate.use(langKey);
		$rootScope.$broadcast('changeLanguage');
	};

	$scope.darkmode = function () {

		$scope.theme = "dark";
	}

	$scope.lightmode = function () {

		$scope.theme = "std";
	}

	$scope.login = function() {
	
		$('form[name="loginForm"]').addClass("was-validated");

		if (!$scope.loginForm.$valid) {
			
			return;
		}

		if ($scope.signup) {

			$http.post('http://localhost:3000/users/inscription', {"username": $scope.username, "password": $scope.password}).
				then(
					function(response) {

						alert("registered")
						$scope.loginAlert = null;
					},
					function(response) {
						$scope.loginAlert = $translate.instant(response.data.error);
					}
			);
		} else {
			$http.post('http://localhost:3000/auth/login', {"username": $scope.username, "password": $scope.password}).
				then(
					function(response) {
						auth.authenticated = true;
						auth.username = $scope.username;
						$scope.loginAlert = null;
					},
					function(response) {
						$scope.loginAlert = $translate.instant(response.data.error);
					}
			);
		}

		$('form[name="loginForm"]').removeClass("was-validated");
	}

	$scope.logout = function() {

		auth.authenticated = false;
		$scope.username = auth.username = null;
		$scope.password = null;
	}
});

routeAppControllers.controller('Init', function ($scope, $routeParams, globalService) {

	$scope.b64 = "";

	$scope.data = {};
	$scope.data.actors = [{ name: "", init: "", b64link: "", endurance: "", modb64: true }];

	$scope.supprimerLigne = function (index) {

		$scope.data.actors.splice(index, 1);
	}

	$scope.trier = function () {

		$scope.data.actors.sort(function (a, b) {
			return a.init - b.init || b.agi - a.agi || b.vig - a.vig;
		});
	}

	$scope.ajouter = function () {

		$scope.data.actors.push({ name: "", init: "", b64link: "", endurance: "", modb64: true });
	}

	$scope.encoder = function () {

		$scope.b64 = globalService.encoding($scope.data, 'init');
	}

	if ($routeParams.b64) {

		$scope.data = JSON.parse(globalService.decoding($routeParams.b64));
	}
});


function getLibelleForStatBlock(nom, texte) {

	return "<b><i>" + nom + "</i></b><br/>" + texte + "<br/><br/>"; 
}

function parseMyInt(myInt) {
	var parsed = parseInt(myInt);
	if (isNaN(parsed)) { return 0; }
	return parsed;
}
routeAppControllers.controller('Help', function ($scope, $translate, $routeParams) {

	$scope.lang = $routeParams.lang;
});

routeAppControllers.controller('Recherche', function ($scope, $http, $q, $routeParams, $rootScope, $translate, globalService, auth) {

	var symboles = {
		
		'talent':'🏆',
		'pouvoir mystique':'🔮',
		'qualite':'⚒',
		'trait monstrueux':'🦄',
		'trait':'🧬',
		'atout':'💪',
		'fardeau':'🎱',
		'rituel':'📖',
		'elixir':'🧪',
		'arme':'⚔',
		'armure':'🛡'
	}

	//TODO Inutilisé
	$scope.majTitre = function() {

		if ($scope.nom && $scope.nom !== "") {
			
			$rootScope.titre = $scope.nom;
		}
	}

	$scope.tradType = function ($type) {

		var ret = [];
		if ($type) {

			for (const type of $type.split("/")) {

				ret.push(symboles[type] + $translate.instant('TYPE_' + type.replace(' ', '_').toUpperCase()));
			}

			return ret.join("/");
		}

		return '';
	}

	$scope.importer = function ($fileContent, $switch) {

		var jsonImporter = {};
		if ($fileContent) {

			jsonImporter = JSON.parse($fileContent);

			$scope.nom = jsonImporter.nom;
			$scope.agi = jsonImporter.agi;
			$scope.forc = jsonImporter.forc;
			$scope.pre = jsonImporter.pre;
			$scope.vol = jsonImporter.vol;
			$scope.vig = jsonImporter.vig;
			$scope.dis = jsonImporter.dis;
			$scope.ast = jsonImporter.ast;
			$scope.per = jsonImporter.per;
			$scope.ini = jsonImporter.ini;
			$scope.typ = jsonImporter.typ;
			$scope.def = jsonImporter.def;
			$scope.end = jsonImporter.end;
			$scope.sd = jsonImporter.sd;
			$scope.sc = jsonImporter.sc;
			$scope.cp = jsonImporter.cp;
			$scope.deg = jsonImporter.deg;
			$scope.arm = jsonImporter.arm;
			$scope.notes = jsonImporter.notes;
			$scope.tactics = jsonImporter.tactics;
			$scope.shadow = jsonImporter.shadow;
			$scope.equipment = jsonImporter.equipment;
			$scope.rulesSet = jsonImporter.regles;
			if (jsonImporter.lang) {
				$rootScope.lang = jsonImporter.lang;
				$translate.use(jsonImporter.lang);
			}
			if (jsonImporter.integrated)
				$scope.statBlockProps.integrated = jsonImporter.integrated;
		}

		$scope.loadJson().then(function successCallback(response) {

			if ($switch) {

				for (var keyName in $scope.talents) {	

					if (response.data[keyName]) {
						
						if ($scope.talents[keyName].epingle) {	
							response.data[keyName].epingle = true;
						}	
						if ($scope.talents[keyName].epinglen) {	
							response.data[keyName].epinglen = true;
						}	
						if ($scope.talents[keyName].epinglea) {	
							response.data[keyName].epinglea = true;	
						}	
						if ($scope.talents[keyName].epinglem) {	
							response.data[keyName].epinglem = true;
						}	
					}
				}
			}

			$scope.talents = response.data;

			if ($fileContent) {

				if ("v2" === jsonImporter.format) {
					
					for (var tmp in jsonImporter.epingles) {
						$scope.talents[jsonImporter.epingles[tmp]].epingle = true;
					}	
					for (var tmp in jsonImporter.epinglesn) {
						$scope.talents[jsonImporter.epinglesn[tmp]].epinglen = true;
					}	
					for (var tmp in jsonImporter.epinglesa) {
						$scope.talents[jsonImporter.epinglesa[tmp]].epinglea = true;
					}	
					for (var tmp in jsonImporter.epinglesm) {
						$scope.talents[jsonImporter.epinglesm[tmp]].epinglem = true;
					}
				} else {
					
					// Import legacy
					for (var keyName in $scope.talents) {	

						if (jsonImporter.epingles.includes($scope.talents[keyName].nom)) {
							$scope.talents[keyName].epingle = true;
						}	
						if (jsonImporter.epinglesn.includes($scope.talents[keyName].nom)) {
							$scope.talents[keyName].epinglen = true;
						}	
						if (jsonImporter.epinglesa.includes($scope.talents[keyName].nom)) {
							$scope.talents[keyName].epinglea = true;
						}	
						if (jsonImporter.epinglesm.includes($scope.talents[keyName].nom)) {
							$scope.talents[keyName].epinglem = true;
						}
					}
				}
	
				$scope.epingleSeulement = true;
				(jsonImporter.integrated) ? $scope.calculsStatBlock(false) : $scope.calculsStatBlock(true);
				//$('#importJson').modal('hide');
			}
		}, function errorCallback(response) {

			console.log(response);
		});
	}

	$scope.loadJson = function () {

		var deferred = $q.defer();

		$http({

			method: 'GET',
			url: window.location.origin + '/json/' + (($scope.rulesSet) ? $scope.rulesSet : $rootScope.lang) + '_new.json'
		}).then(function successCallback(response) {

			deferred.resolve(response);
		}, function errorCallback(response) {

			console.log(response);
			deferred.reject("nok");
		});

		return deferred.promise;
	}

	$scope.$on('changeLanguage', function(event, args) {

		$scope.importer(null, true);
	});

	$scope.encoder = function () {

		$scope.b64 = globalService.encoding($scope.getDataToExport(), 'search');
	}

	$scope.getDataToExport = function(abititiesNames) {

		var epingles = [];	
		var epinglesn = [];	
		var epinglesa = [];	
		var epinglesm = [];	

		for (var keyName in $scope.talents) {
			var abToPush = keyName;
			if (abititiesNames) {
				abToPush = $scope.talents[keyName].nom;
			}

			if ($scope.talents[keyName].epingle) {
				epingles.push(abToPush);	
			}	
			if ($scope.talents[keyName].epinglen) {	
				epinglesn.push(abToPush);	
			}	
			if ($scope.talents[keyName].epinglea) {	
				epinglesa.push(abToPush);	
			}	
			if ($scope.talents[keyName].epinglem) {	
				epinglesm.push(abToPush);	
			}	
		}

		return {
			nom: $scope.nom,
			agi: $scope.agi,
			forc: $scope.forc,
			pre: $scope.pre,
			vol: $scope.vol,
			vig: $scope.vig,
			dis: $scope.dis,
			ast: $scope.ast,
			per: $scope.per,
			ini: $scope.ini,
			typ: $scope.typ,
			def: $scope.def,
			end: $scope.end,
			sd: $scope.sd,
			sc: $scope.sc,
			cp: $scope.cp,
			deg: $scope.deg,
			arm: $scope.arm,
			notes: $scope.notes,
			tactics: $scope.tactics,
			shadow: $scope.shadow,
			equipment: $scope.equipment,
			regles: $scope.rulesSet,
			lang: $rootScope.lang,
			epingles: epingles,
			epinglesn: epinglesn,
			epinglesa: epinglesa,
			epinglesm: epinglesm,
			format: "v2"
		};
	}

	$scope.exporter = function () {

		download(JSON.stringify($scope.getDataToExport()), $scope.nom, 'application/json');
	}

	$scope.copyToClipboard = function () {

		navigator.clipboard.writeText(JSON.stringify($scope.getDataToExport(true))).then(function() {
			/* clipboard successfully set */
			$("#copied").text($translate.instant('COPIED'));
		  }, function() {
			/* clipboard write failed */
		  });
	}

	$scope.openHelpPage = function() {

		window.open('#!/help?lang=' + $rootScope.lang, '_blank').focus();
	}
	
	$scope.openB64LinkPage = function() {

		window.open($scope.b64, '_blank').focus();
	}

	$scope.getSpentPoints = function() {

		return parseMyInt($scope.agi) + parseMyInt($scope.forc) + parseMyInt($scope.pre)
				+ parseMyInt($scope.vol) + parseMyInt($scope.vig) + parseMyInt($scope.dis)
				+ parseMyInt($scope.ast) + parseMyInt($scope.per);
	}

	//TODO Atouts, Fardeaux
	$scope.calculsStatBlock = function($resetIntegrated) {

		var abilitiesTexts =  "";
		var integrated = {};

		$scope.statBlockProps.abilities = [];
		$scope.statBlockProps.mysticalPowers = [];
		$scope.statBlockProps.traits = [];
		$scope.statBlockProps.rituals = [];

		if ($resetIntegrated)
			$scope.statBlockProps.manageIntegrated = false;

		for (var keyName in $scope.talents) {

			var type = $scope.talents[keyName].type;
			var nom = $scope.talents[keyName].nom;
			if ($scope.talents[keyName].epinglen && !$scope.talents[keyName].epinglea && !$scope.talents[keyName].epinglem) {

				if (type === "talent") {

					abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].novice);
					var name = nom + " (" + $translate.instant('NOVICE').toLowerCase() + ")";
					$scope.statBlockProps.abilities.push(name);
					if ($resetIntegrated || !$scope.statBlockProps.integrated[name])
						integrated[name] = false;
					else
						integrated[name] = $scope.statBlockProps.integrated[name];
				} else if (type === "pouvoir mystique") {

					abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].novice);
					$scope.statBlockProps.mysticalPowers.push(nom + " (" + $translate.instant('NOVICE').toLowerCase() + ")");
				 } else if (type === "rituel") {

					$scope.statBlockProps.rituals.push(nom);
				} else if (type === "trait monstrueux" || (type === "trait" && ($scope.talents[keyName].adepte || $scope.talents[keyName].maitre))) {
					
					var name  = nom + " (I)";
					abilitiesTexts += getLibelleForStatBlock(name, $scope.talents[keyName].novice);
					$scope.statBlockProps.traits.push(name);
					if ($resetIntegrated || !$scope.statBlockProps.integrated[name])
						integrated[name] = false;
					else
						integrated[name] = $scope.statBlockProps.integrated[name];
				} else if ((type === "trait" || type.startsWith("trait/")) && !$scope.statBlockProps.traits.includes(keyName)) {

					abilitiesTexts += "<b><i>" + nom + "</i></b><br/>" + $scope.talents[keyName].novice + "<br/><br/>";
					$scope.statBlockProps.traits.push(nom);
					if ($resetIntegrated || !$scope.statBlockProps.integrated[name])
						integrated[name] = false;
					else
						integrated[name] = $scope.statBlockProps.integrated[name];
				}
			}

			if ($scope.talents[keyName].epinglea && !$scope.talents[keyName].epinglem) {

				if (type === "talent") {

					var name = nom + " (" + $translate.instant('ADEPTE').toLowerCase() + ")";
					$scope.statBlockProps.abilities.push(name);
					if ($resetIntegrated || !$scope.statBlockProps.integrated[name])
						integrated[name] = false;
					else
						integrated[name] = $scope.statBlockProps.integrated[name];

					if ($scope.talents[keyName].epinglen)
						abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].novice);
					abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].adepte);
				} else if (type === "pouvoir mystique") {

					$scope.statBlockProps.mysticalPowers.push(nom + " (" + $translate.instant('ADEPTE').toLowerCase() + ")");

					if ($scope.talents[keyName].epinglen)
						abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].novice);
					abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].adepte);
					
				} else if (type === "trait monstrueux" || type === "trait") {

					var name = nom + " (II)";
					$scope.statBlockProps.traits.push(name);
					if ($resetIntegrated || !$scope.statBlockProps.integrated[name])
						integrated[name] = false;
					else
						integrated[name] = $scope.statBlockProps.integrated[name];;
					
					if ($scope.talents[keyName].epinglen)
						abilitiesTexts += getLibelleForStatBlock(nom + " (I)", $scope.talents[keyName].novice);
					abilitiesTexts += getLibelleForStatBlock(name, $scope.talents[keyName].adepte);
				}
			}

			if ($scope.talents[keyName].epinglem
				|| ($scope.talents[keyName].epingle && !$scope.talents[keyName].epinglea && !$scope.talents[keyName].epinglen && !$scope.talents[keyName].epinglem)) {

				if (type === "talent") {

					var name = nom + " (" + $translate.instant('MAITRE').toLowerCase() + ")";
					$scope.statBlockProps.abilities.push(name);
					if ($resetIntegrated || !$scope.statBlockProps.integrated[name])
						integrated[name] = false;
					else
						integrated[name] = $scope.statBlockProps.integrated[name];

					if ($scope.talents[keyName].epinglen)
						abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].novice);
					if ($scope.talents[keyName].epinglea)
						abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].adepte);
					abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].maitre);
				} else if (type === "pouvoir mystique") {

					$scope.statBlockProps.mysticalPowers.push(nom + " (" + $translate.instant('MAITRE').toLowerCase() + ")");

					if ($scope.talents[keyName].epinglen)
						abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].novice);
					if ($scope.talents[keyName].epinglea)
						abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].adepte);
					abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].maitre);
				} else if (type === "rituel") {

					$scope.statBlockProps.rituals.push(nom);
				} else if (type === "trait monstrueux" || (type === "trait" && ($scope.talents[keyName].adepte || $scope.talents[keyName].maitre))) {

					var name = nom + " (III)";
					$scope.statBlockProps.traits.push(name);
					if ($resetIntegrated || !$scope.statBlockProps.integrated[name])
						integrated[name] = false;
					else
						integrated[name] = $scope.statBlockProps.integrated[name];

					if (($scope.talents[keyName].epingle && ($scope.talents[keyName].adepte || $scope.talents[keyName].maitre)) || $scope.talents[keyName].epinglem) {

						if ($scope.talents[keyName].epinglen)
							abilitiesTexts += getLibelleForStatBlock(nom + " (I)", $scope.talents[keyName].novice);
						if ($scope.talents[keyName].epinglea)
							abilitiesTexts += getLibelleForStatBlock(nom + " (II)", $scope.talents[keyName].adepte);
						abilitiesTexts += getLibelleForStatBlock(name, $scope.talents[keyName].maitre);
					} else {
						
						abilitiesTexts += getLibelleForStatBlock(nom + " (I)", $scope.talents[keyName].novice);
					}
					
				} else if ((type === "trait" || type.startsWith("trait/")) && !$scope.statBlockProps.traits.includes(nom)) {

					abilitiesTexts += getLibelleForStatBlock(nom, $scope.talents[keyName].novice);
					$scope.statBlockProps.traits.push(nom);
					if ($resetIntegrated || !$scope.statBlockProps.integrated[name])
						integrated[name] = false;
					else
						integrated[name] = $scope.statBlockProps.integrated[name];
				}
			}
		}
		$scope.statBlockProps.integrated = integrated;
		$scope.statBlockProps.abilitiesTexts = abilitiesTexts;
	};

	$scope.getMyPcNpc = function() {

		$http.get('http://localhost:3000/json/list').then(
			function(response) {

				$scope.myPcNpcArr = response.data;
			},
			function(error) {

				$scope.myPcNpcArr = null;
			}
		)
	}

	$scope.loadPcNpc = function(name) {

		$http.post('http://localhost:3000/json/get', { "name": name }).then(
			function(response) {
				
				$scope.importer(JSON.stringify(response.data));
			},
			function(error) {

				console.log(error.data);
			}
		);
	}

	$scope.deletePcNpc = function(name) {

		if (confirm("Are you sure to delete this ?")) {

			$http.post('http://localhost:3000/json/delete', { "name": name }).then(
				function(response) {
				
					$scope.getMyPcNpc();
				},
				function(error) {

					console.log(error.data);
				}
			);
		}
	}

	$scope.savePcNpc = function() {

		$http.post('http://localhost:3000/json/save', { "jsonData": $scope.getDataToExport() }).then(
			function(response) {
				
			},
			function(error) {

				console.log(error.data)
			}
		);
	}

	$scope.isAuthenticated = auth.isAuthenticated;
	
	$scope.talents = {};

	$scope.filtreNomTalent = "";
	$scope.epingleSeulement = false;
	$scope.filtreType = "tous";
	$scope.filtreLivre = "tous";
	$scope.filtreTrad = "tous";
	$scope.filtreAttr = "tous";
	$scope.afficherDescription = false;
	$scope.rulesSet = "";

	$scope.notes = "";
	$scope.tactics = "";
	$scope.shadow = "";
	$scope.equipment = "";

	$scope.nom = "";
	$scope.agi = "";
	$scope.forc = "";
	$scope.pre = "";
	$scope.vol = "";
	$scope.vig = "";
	$scope.dis = "";
	$scope.ast = "";
	$scope.per = "";
	$scope.ini = "";
	$scope.typ = "";
	$scope.def = "";
	$scope.end = "";
	$scope.sd = "";
	$scope.sc = "";
	$scope.cp = "";
	$scope.deg = "";
	$scope.arm = "";

	$scope.statBlockProps = {
		
		newTab: function(value) {
			
			var jsonToSend = $scope.getDataToExport();
			jsonToSend.integrated = $scope.statBlockProps.integrated;
			window.open(globalService.encoding(jsonToSend, 'statblock'), '_blank').focus();
		},
		getAbilities: function (value) {

			if ($scope.statBlockProps.abilities.length > 0 || $scope.statBlockProps.mysticalPowers.length > 0 || $scope.statBlockProps.rituals.length > 0) {

				var all = $scope.statBlockProps.abilities.concat($scope.statBlockProps.mysticalPowers.concat($scope.statBlockProps.rituals));

				for (var keyName in $scope.statBlockProps.integrated) {

					var idx = all.indexOf(keyName);
					if (idx !== -1 && $scope.statBlockProps.integrated[keyName]) {
						all.splice(idx, 1);
					}
				};

				return (all.length > 0) ? all.join(", ") : "-";
			}
			else
				return "-";
		},
		getIntegrated: function (value) {

			var integrated = [];
			for (var keyName in $scope.statBlockProps.integrated) {

				if ($scope.statBlockProps.integrated[keyName])
					integrated.push(keyName);
			}
			return (integrated.length > 0) ? integrated.join(", ") : "-";
		},
		getTraits: function (value) {

			if ($scope.statBlockProps.traits.length > 0)
				return $scope.statBlockProps.traits.join(", ");
			else
				return "-";
		},
		getDefault: function (value) {
			if (angular.isDefined(value) && value !== "") {
				return value;
			} else {
				return "N/A";
			}
		},
		getStatBlockColumnsNb: function (value) {

			if (!$scope.statBlockProps.hideAbilities) {
				return "6";
			} else {
				return "12";
			}
		}
	};

	$scope.statBlockProps.abilitiesTexts = "";
	$scope.statBlockProps.hideAbilities = false;

	$scope.statBlockProps.integrated = {};

	$scope.statBlockProps.abilities = [];
	$scope.statBlockProps.mysticalPowers = [];
	$scope.statBlockProps.rituals = [];
	$scope.statBlockProps.traits = [];

	if ($routeParams.b64) {

		$scope.importer(globalService.decoding($routeParams.b64));
	} else {

		$scope.importer();
	}
});

routeAppControllers.controller('LostPwd', function ($scope, $translate, $http) {

	$scope.pwdReset = () => {

		$('form[name="pwdResetForm"]').addClass("was-validated");

		if (!$scope.pwdResetForm.$valid) {
			return;
		}

		$http.post('http://localhost:3000/users/pwdReset', { "username": $scope.email }).then(
			function(response) {
				
				$scope.emailSent = true;
				$scope.message =  $translate.instant('MSG_RES_EMAIL_SENT');
				$('#staticBackdrop').modal('show');
			},
			function(response) {
				
				$scope.message = $translate.instant(response.data.error);
				$('#staticBackdrop').modal('show');
			}
		);

		$('form[name="pwdResetForm"]').removeClass("was-validated");
	}

	$scope.validateToken = () => {

		$('form[name="tokenForm"]').addClass("was-validated");
		
		if (!$scope.tokenForm.$valid) {
			return;
		}

		$http.post('http://localhost:3000/users/pwdReset/validation/' + $scope.token, { "username": $scope.email }).then(
			function(response) {
				
				$scope.tokenValidated = true;
				$scope.message =  $translate.instant('MSG_RES_TOKEN_OK');
				$('#staticBackdrop').modal('show');
			},
			function(response) {

				$scope.message = $translate.instant(response.data.error);
				$('#staticBackdrop').modal('show');
			}
		);

		$('form[name="pwdResetForm"]').removeClass("was-validated");
	}

	$scope.changePwd = () => {

		$('form[name="pwdChangeForm"]').addClass("was-validated");

		if ($scope.pwd1 !== $scope.pwd2) {

			$scope.pwdChangeForm.pwd2.$setValidity('pwd', false);
		}

		if (!$scope.pwdChangeForm.$valid) {
			return;
		}

		$http.post('http://localhost:3000/users/pwdReset/changePwd', { "username": $scope.email, "newPassword": $scope.pwd1, "token": $scope.token }).then(
			function(response) {
				$('#cardBodyPwdChange').text($scope.message =  $translate.instant('MSG_RES_PWD_CHANGED'));
			},
			function(response) {

				$scope.message = $translate.instant(response.data.error);
				$('#staticBackdrop').modal('show');
			}
			);
	}
})

routeAppControllers.controller('Test', function ($scope, $q, $http) {

	$scope.json2 = {};
})

routeAppControllers.controller('Davokar', function ($scope, $q, $routeParams, $translate, globalService) {

	// ORIENTATION et MISFORTUNE
	const tableData = { "tableOrientation" : [
		["1", "The Camp Site", "The characters find an abandoned camp site. Is it truly abandoned? Is there any valuable equipment left behind, or something dangerous?"],
		["2", "The Corpse", "The characters come across the remains of a dead fortune-hunter who was not prepared for the challenges of Davokar. What killed her? Do the characters recognize the deceased?"],
		["3", "A Distant Howl", "An inhuman howl is heard way out in the woods; soon thereafter it is heard again, closer this time. How do the members of the expedition react?"],
		["4", "A Bad Omen", "The characters encounter signs indicating a clear and present danger. What kind of signs – footprints, cadavers, mucus, blood? And how fresh are they?"],
		["5", "Sudden silence", "Suddenly the forest holds its breath and a tense silence falls over the expedition. Why?"],
		["6", "Stuck", "One of the expedition’s carts or part of their equipment gets stuck, in mud, in a crack or under a falling giant tree. It takes two people, each of them rolling a test against Strong, to remedy the situation. If one of the tests fails, the company will travel ten kilometers shorter this day; if both tests fail, it takes a whole day before they can continue forth."],
		["7", "Shadowed", "The expedition is being followed, which can be noticed with a test against Vigilant. Who is spying on them, and with what intent?"],
		["8", "Thorns", "The expedition stops at the edge of a vast field of dense thorn bushes. They can go around, thereby cutting the day’s traveling distance in half. If they try to force their way through, all members must roll two tests against Discreet – each failure deals 1d4 damage (ignoring Armor)."],
		["9", "The Patrol", "A unit from the Queen’s Rangers orders the expedition to halt. They rummage through packs and other bags and demand to see the group’s Explorer’s License. Are they really rangers of the Queen? If yes, are they corrupt?"],
		["10", "Mosquito swarm", "During the day’s walk, the characters are harassed by a swarm of mosquitos. What they don’t know is that the insects are exposing them to a disease. See rules on Disease in Symbaroum (page 169 in the Monster Codex) and roll 1d6 – 1–3 Weak Disease; 4–5 Moderate Disease; 6 Strong Disease."],
		["11", "Downpour", "A strange, icy rain hammers down on the forest and the expedition is soaked. The characters can choose to test Strong or Resolute; a failure means that the person catches a chill and suffers –3 to all success tests until he or she gets warm by sitting close to a fire."],
		["12", "Lost", "The characters have to admit that they have lost their bearings. As usual, the guide rolls one Orientation test per day, but with a –5 modification. If failed, the group wanders in circles and makes no progress at all; if successful, they progress at normal speed. It takes three successful tests with a –5 modification before they escape the bewildering area and hence are free from the negative modification. What makes the terrain so difficult to navigate?"],
		["13", "Sick Animals", "The animals of the expedition seem exhausted and throw up all they eat. A character with Beast Lore can help them by successfully rolling a Cunning test – one test per day and animal. If the company travels with one or more sick animals, they only move a quarter of the normal distance. Maybe they have to leave some animals behind?"],
		["14", "Marshland", "Suddenly, the characters reach a vast marshland which will take half a day to circumvent. If they choose to proceed, the guide must roll a Vigilant test; if failed, a random expedition member starts to sink and one of the others must pass two Strong tests to save him or her. If three tests fail before two successes are rolled, the unlucky one disappears into the muck."],
		["15", "Ambush", "Hostiles in the area are planning to ambush the characters, which may be noted with a [Vigilant –5] test. Who is the enemy and what is its goal?"],
		["16", "Spoiling Food", "The characters discover that something has consumed some of their supplies while they were sleeping or traveling, or the provisions are attacked by aggressive microbes which cause part of the stock to rot. The expedition loses 1d20 rations."],
		["17", "Wildfire", "Without warning, a wildfire spreads toward the expedition at an alarming rate. Each person must pass two Quick tests to reach a safe location. Anyone who fails one or more tests takes 1d4 damage for 1d4 turns (ignoring Armor) before getting to safety; note that they cannot stop and try to extinguish the flames before then. What happens to the pack animals and/or the contracted carriers?"],
		["18", "From Bad to Worse", "Roll two times on this table and use both outcomes."],
		["19", "Discord in the Ranks", "The strenuous journey is starting to get on peoples’nerves. Two non-player characters in the expedition start fighting violently. What has happened? Is one of them infected by something?"],
		["20", "Sacred Ground", "The ground that the characters are traversing is considered taboo for strangers by the local population – the trespassers must die! Who lives in the area? Why the taboo?"],
		["21", "Corrupted Soil", "The environment suddenly feels twisted and sick; soon it can be seen, on the dark veins and black leaves of the vegetation. The area is blight-stricken; the characters can turn back and choose another way (loses one day), or they can proceed and roll a Strong test each – a failure means they suffer 1d6 points of temporary corruption that do not leave the body until they have left the corrupted area behind."],
		["22", "Hangman’s Hill", "Without warning you see them hanging there, in nooses from the lower branches, gutted and mutilated: the members of a large expedition. The characters’ companions must be persuaded [Persuasive←Resolute] not to turn around and leave. Who has done this, and why?"],
		["23", "Sabotage", "During the night, a lone saboteur tries to access the expedition’s members, provisions and/or animals. Who is the saboteur? What is the target? Can the characters thwart the attempt?"],
		["24", "The Ironsworn’s Ultimatum", "They appear as if from out of the very air, along the path where the characters are walking – an Iron Pact warband, arrows pointing at the travelers. The leader of the elves gives an ultimatum: turn around and take a long detour (two days) or face the Ironsworn’s wrath. Why? Can an agreement be reached, such as being blindfolded and escorted through the area?"],
		["25", "Lair of Evil", "Something in this region attracts aggressive monsters and adversaries – roll an extra time on Table 28: Enemies in Davokar (page 99). What is attracting these creatures to the area?"],
		["26", "Delirium", "The characters start hearing and seeing what isn’t there; horrifying figures connected to their own history. If a character openly questions what he or she sees and hears, they can roll a [Resolute –3] test; success means that the hallucinations subside. The Game Master decides how much time passes before the group can resume the journey. Is the delirium caused by something they have eaten, or by something in the air or water?"],
		["27", "The Eternal Contagion", "Everything in the area is dead or twisted beyond recognition. This place is horribly corrupt; even if the characters decide to turn back and go around (losing one day), they must pass a Strong test or suffer one point of permanent corruption. If proceeding and failing the Strong test, they suffer 1d4 points of permanent corruption; should the test succeed, they are instead plagued by 1d6 temporary corruption that lingers all day. In both cases, all provisions are automatically infected – each ration consumed deals one point of temporary corruption that does not go away until the afflicted has eaten pure food for a week."],
		["28", "Disappearance", "An expedition member (character, companion or animal with supplies) suddenly disappears, as if evaporated into nothing. Was it transferred to another place, time or world? Who or what caused the disappearance, and why?"],
		["29", "Heart of Darkness", "A member of the expedition encounters something that makes him or her crazy (bug bite, spores, foul air or similar). Select a non-player or player character at random, who then must roll a Resolute test: the character suffers 1d4 permanent corruption if the test is successful, or 1d10 if it fails. Irrespective of which, the victim will attack the closest person with the intent of killing him or her – a state that remains for the duration of the scene."],
		["30", "The Eye of the Forest", "All who travel the area feel as if they are being watched by the forest itself, as if it is assessing them, searching for weaknesses. Suddenly the feeling grows many times stronger, becomes threatening, like the whole world is out to get them. All who fail a [Resolute –5] test are struck by panic and start fleeing in different directions. The panic persists for 1d4 hours, and during that time the expedition members become scattered, alone in the depths of Davokar…"]
	]}

	// RUINE et TRESOR
	var tableRuine = [
		["1–7", "None", 0, 0],
		["1–7", "None", 0, 0],
		["1–7", "None", 0, 0],
		["1–7", "None", 0, 0],
		["1–7", "None", 0, 0],
		["1–7", "None", 0, 0],
		["1–7", "None", 0, 0],
		["8–10", "Completely crumbled or already ransacked", 0, 0],
		["8–10", "Completely crumbled or already ransacked", 0, 0],
		["8–10", "Completely crumbled or already ransacked", 0, 0],
		["11–12", "Small, badly damaged", 1, 4],
		["11–12", "Small, badly damaged", 1, 4],
		["13–14", "Small, dilapidated", 1, 6],
		["13–14", "Small, dilapidated", 1, 6],
		["15–16", "Small, well-preserved", 1, 8],
		["15–16", "Small, well-preserved", 1, 8],
		["17–18", "Medium, badly damaged", 2, 6],
		["17–18", "Medium, badly damaged", 2, 6],
		["19", "Medium, dilapidated", 2, 8],
		["20", "Medium, dilapidated", 2, 10],
		["21", "Grand, badly damaged", 3, 8],
		["22", "Grand, dilapidated", 3, 10],
		["23", "Grand, well-preserved", 3, 12]
	];

	// RENCONTRE
	var tableRencontre = [
		[1, "Hunting party", "1D6+2", 0, false, 1, 6, 2],
		[2, "Missionaries", "PC+1D6", 3, true, 1, 6, 0],
		[3, "Treasure hunters", "PC+1D6", 1, true, 1, 6, 0],
		[4, "Local settlement", "1D20+20", 5, false, 1, 20, 20],
		[5, "Rangers", "PC+2", 0, true, 0, 0, 2],
		[6, "Large expedition", "PC+1D6", 3, true, 1, 6, 0],
		[7, "Nomadic goblins", "1D20+20", -1, false, 1, 20, 20],
		[8, "Diplomatic elves, Civilized trolls or Peaceful bestiaals", "PC+1D10", -5, true, 1, 10, 0]
	];

	// ENNEMIS
	var tableEnnemi = [
		[9, "Weak", "Fortune Hunters, Jakaars, Frost Lights"],
		[10, "Weak", "Fortune Hunters, Jakaars, Frost Lights"],
		[11, "Weak, with Ordinary leader", "Robber chief + Robbers"],
		[12, "Weak, with Ordinary leader", "Robber chief + Robbers"],
		[13, "Ordinary", "Village Warriors, Kotkas, Blightborn Humans"],
		[14, "Ordinary", "Village Warriors, Kotkas, Blightborn Humans"],
		[15, "Ordinary, with Challenging leader", "Necromage + Dragouls"],
		[16, "Ordinary, with Challenging leader", "Necromage + Dragouls"],
		[17, "Challenging", "Rage Trolls, Ferbers, Killer Shrubs"],
		[18, "Challenging", "Rage Trolls, Ferbers, Killer Shrubs"],
		[19, "Challenging, with Strong leader", "Lindworm + Aboars"],
		[20, "Challenging, with Strong leader", "Lindworm + Aboars"],
		[21, "Strong", "Hunger Wolves, Colossi, Stone Boars"],
		[22, "Strong", "Hunger Wolves, Colossi, Stone Boars"],
		[23, "Strong, with Mighty leader", "Skullbiter Queen + Skullbiter Crushers"],
		[24, "Mighty enemies, or Strong x 2", "Ravenous Willow old crushers, Primal Blight Beasts, Liege Trolls"],
		[25, "Mighty enemies, with Legendary leader", "The World Serpent + World Serpent swallowers"]
	]

	// TERRAIN
	var tableTerrain = [
		["1–10", "Nothing special."],
		["1–10", "Nothing special."],
		["1–10", "Nothing special."],
		["1–10", "Nothing special."],
		["1–10", "Nothing special."],
		["1–10", "Nothing special."],
		["1–10", "Nothing special."],
		["1–10", "Nothing special."],
		["1–10", "Nothing special."],
		["1–10", "Nothing special."],
		["11–12", "Easily traversable : The party covers 10 km more."],
		["11–12", "Easily traversable : The party covers 10 km more."],
		["13–14", "Swamp/marsh : The party covers 5 km less."],
		["13–14", "Swamp/marsh : The party covers 5 km less."],
		["15–16", "Sinkhole : Everyone tests Vigilant. Failure causes 1D8 falling damage."],
		["15–16", "Sinkhole : Everyone tests Vigilant. Failure causes 1D8 falling damage."],
		["17–18", "Poisonous : spores Everyone tests Strong. Failure causes 3 damage for 3 turns."],
		["17–18", "Poisonous : spores Everyone tests Strong. Failure causes 3 damage for 3 turns."],
		["19–20", "Vengeful terrain : PC number of creatures, suiting the location."],
		["19–20", "Vengeful terrain : PC number of creatures, suiting the location."],
		["21", "Slightly corrupted nature : One roll on Table 2 in the Symbaroum Monster Codex (page 25)."],
		["22", "Corrupted nature : Three rolls on Table 2 in the Symbaroum Monster Codex (page 25)."],
		["23+", "Severely corrupted nature : Five rolls on Table 2 in the Symbaroum Monster Codex (page 25)."],
		["23+", "Severely corrupted nature : Five rolls on Table 2 in the Symbaroum Monster Codex (page 25)."],
		["23+", "Severely corrupted nature : Five rolls on Table 2 in the Symbaroum Monster Codex (page 25)."]
	]

	$scope.data = {};

	$scope.data.vigilance = 10;
	$scope.data.discretion = 10;
	$scope.data.provisions = 0;
	$scope.data.information = false;
	$scope.data.sourceEcrite = false;
	$scope.data.sourceEcriteSup5 = false;
	$scope.data.survie = "novice";
	$scope.data.davokar = "clair";
	$scope.data.rester = false;
	$scope.data.jours = [];
	$scope.data.jour = 0;
	$scope.data.pjs = 1;
	$scope.data.tresorsTrouves = [];

	$scope.data.logs = [];

	$scope.b64 = "";

	if ($routeParams.b64) {

		$scope.data = JSON.parse(globalService.decoding($routeParams.b64));
	}

	$scope.encoder = function () {

		$scope.b64 = globalService.encoding($scope.data, 'davokar');
	}

	$scope.fillInfo = function (info, index) {

		$scope.modalInfo = $scope.data.jours[index][info];
	}

	$scope.chercherTresor = function (index) {

		if (!$scope.data.jours[index].vigilancePJTresor) {
			alert($translate.instant('DAV_ALERTE_VIG'));
			return;
		}
		var seuilDebris = 6;
		var seuilCuriosite = 16;
		var seuilMystique = 20;

		if ($scope.data.davokar === "sauvage") {

			seuilDebris = 5;
			seuilCuriosite = 14;
			seuilMystique = 19;
		} else if ($scope.data.davokar === "sombre") {

			seuilDebris = 3;
			seuilCuriosite = 12;
			seuilMystique = 19;
		}

		// Tresor
		$scope.data.jours[index].tresorsRestants--;
		var tresor = $translate.instant('DAV_NONE');
		var jetTresor = $scope.jetDe(20);
		if (!$scope.data.jours[index].ruine.startsWith($translate.instant('DAV_NONE')) && jetTresor <= $scope.data.jours[index].vigilancePJTresor) {

			var jetTypeTresor = $scope.jetDe(20);
			if (jetTypeTresor < seuilDebris) {

				tresor = $translate.instant('DAV_DEBRIS') + " : " + $scope.jetDe(10) + " thalers";
			} else if (jetTypeTresor < seuilCuriosite) {

				tresor = $translate.instant('DAV_CURIOSITE') + " (" + $scope.jetDe(100) + ") : " + (10 + $scope.jetDe(10)) + " thalers";
			} else if (jetTypeTresor < seuilMystique) {

				tresor = $translate.instant('DAV_MYSTIQUE') + " (" + $scope.jetDe(20) + ") : " + (100 + $scope.jetDe(100)) + " thalers";
			} else {

				tresor = $translate.instant('DAV_ARTEFACT') + " ! (" + $scope.jetDe(12) + ")";
			}
		}

		if (!tresor.startsWith($translate.instant('DAV_NONE')))
			$scope.data.tresorsTrouves.push(tresor);
		alert(tresor);
	}

	$scope.genJourOut = function () {

		var deferred = $q.defer();

		// Calcul différents variables selon le type de davokar
		var malus = 0;
		var diffDavokarSurvie = false;

		if ($scope.data.survie === "novice") {

			if ($scope.data.davokar === "sauvage") {

				malus = 3;
				diffDavokarSurvie = true;
			}
			if ($scope.data.davokar === "sombre") {

				malus = 5;
				diffDavokarSurvie = true;
			}
		} else if ($scope.data.survie === "adepte") {

			if ($scope.data.davokar === "sombre") {

				malus = 3;
				diffDavokarSurvie = true;
			}
		}

		$scope.data.logs.push("Malus diff Davokar/Survie : " + diffDavokarSurvie + " -> " + malus);

		var modDavokar = 0;
		var reussiteOrientationSup5 = false;
		var orientation = true;
		var modSourceEcrite = 0;
		
		if ($scope.data.sourceEcrite)
			modSourceEcrite = 1;

		if ($scope.data.davokar === "clair" && $scope.data.sourceEcriteSup5)
			modSourceEcrite = 2;

		if ($scope.data.davokar === "sauvage") {

			modDavokar = 2;
		} else if ($scope.data.davokar === "sombre") {

			modDavokar = 5;
		}

		$scope.data.logs.push("Modifier written source : " + modSourceEcrite);
		$scope.data.logs.push("Modifier Davokar level : " + modDavokar);

		// ORIENTATION : Calcul malus selon difference entre niveau survie et davokar
		var texteOrientation = jetOrientation = "N/A";
		if (!$scope.data.rester) {

			// ORIENTATION : Ajout bonus si detention information orale & source écrite
			if ($scope.data.information)
				malus = malus - 1;

			if ($scope.data.sourceEcrite)
				malus = malus - 1;

			// ORIENTATION : Test vigilance
			var jetOrientation = $scope.jetDe(20);
			
			$scope.data.logs.push("Orientation Roll : " + jetOrientation + " <= " + $scope.data.vigilance + " (VIG) + " + malus
					+ " (Davokar Malus) -> "  + (jetOrientation <= ($scope.data.vigilance - malus)));

			// Raté
			if (jetOrientation > ($scope.data.vigilance - malus)) {

				orientation = false;

				// ORIENTATION : Jet MISFORTUNE
				var misfortune = $scope.jetDe(20);
				$scope.data.logs.push("Rolled misfortune (no modifier) : " + misfortune);

				if ($scope.data.davokar === "sauvage")
					misfortune = misfortune + 5;

				if ($scope.data.davokar === "sombre")
					misfortune = misfortune + 10;

				$scope.data.logs.push("Rolled misfortune (after Davokar modifier) : " + misfortune);

				texteOrientation = tableData.tableOrientation[misfortune - 1][1] + " : " + tableData.tableOrientation[misfortune - 1][2];
			}

			// Réussi > 5
			if (($scope.data.vigilance - malus) - jetOrientation >= 5) {

				reussiteOrientationSup5 = true;
			}
			$scope.data.logs.push("Orientation success > 5 : " + reussiteOrientationSup5);

			// ORIENTATION : Texte a afficher
			jetOrientation = (orientation) ? "OK" : "NOK : " + misfortune;
		}

		// PROVISIONS
		// PROVISIONS : Test vigilance
		var provisions = 0;
		var rollProvisions = $scope.jetDe(20);

		$scope.data.logs.push("Provision Roll : " + rollProvisions + " <= " + $scope.data.vigilance + " (VIG) -> " + (rollProvisions <= $scope.data.vigilance));
		
		if (rollProvisions <= $scope.data.vigilance) {

			var provisionsTrouves = false;
			// PROVISIONS : Jet provisions si niveau survie suffisant par rapport a niveau davokar
			if ($scope.data.survie === "novice") {

				if ($scope.data.davokar === "clair") {

					provisionsTrouves = true;
				}
			} else if ($scope.data.survie === "adepte") {

				if ($scope.data.davokar === "clair" || $scope.data.davokar === "sauvage") {

					provisionsTrouves = true;
				}

			} else if ($scope.data.survie === "maitre") {

				provisionsTrouves = true;
			}

			$scope.data.logs.push("Found provisions ? " + provisionsTrouves);

			if (provisionsTrouves) {

				var jetProvisions = $scope.jetDe(6);
				
				$scope.data.logs.push("Rolled found provisions : " + jetProvisions);

				$scope.data.provisions = parseInt($scope.data.provisions) + jetProvisions;
				provisions = jetProvisions;
			}
		}

		$scope.data.provisions = parseInt($scope.data.provisions) - parseInt($scope.data.pjs);

		// Ruine
		var texteRuine = jetRuine = "N/A";
		var tresorsRestants = 0;
		if (!$scope.data.rester) {

			var bonusOrientation = (orientation && !diffDavokarSurvie) ? 2 : 0;
			$scope.data.logs.push("Orientation bonus for Ruins : " + bonusOrientation);
			var jetRuine = $scope.jetDe(20) + bonusOrientation + modDavokar;
			$scope.data.logs.push("Ruin Roll : " + jetRuine);
			if (jetTerrain <= 0) jetTerrain = 1;
			
			var id = (jetRuine > 22) ? 22 : (jetRuine - 1);
			texteRuine = tableRuine[id][1] + ".";

			for (var i = 0; i < tableRuine[id][2]; i++) {

				tresorsRestants += $scope.jetDe(tableRuine[id][3]);
			}
			
			if (tresorsRestants > 0) {

				tresorsRestants += 2;
			}
		} else {

			tresorsRestants = $scope.data.jours[$scope.data.jours.length - 1].tresorsRestants;
		}

		var texteRencontre = $translate.instant('DAV_NONE');

		var jetRencontre = $scope.jetDe(20);
		$scope.data.logs.push("Encounter Roll : " + jetRencontre + " (roll) + " + modDavokar + " (Davokar Modifier)");
		jetRencontre += modDavokar;
		if (jetRencontre <= 0) jetRencontre = 1;

		$scope.data.logs.push("Encounter Roll final result : " + jetRencontre);

		if (jetRencontre < 9) {

			var nbBase = tableRencontre[jetRencontre - 1][7];
			var jetNbEnnemis = (tableRencontre[jetRencontre - 1][6] > 0) ? $scope.jetDe(tableRencontre[jetRencontre - 1][6]) : 0;
			var pjOuNon = (tableRencontre[jetRencontre - 1][4]) ? $scope.data.pjs : 0;
			var nbEnnemis = nbBase + jetNbEnnemis + pjOuNon;
			
			$scope.data.logs.push("Encounter Roll -> Nb : " + nbBase +" (base) + " + jetNbEnnemis + " (d" + tableRencontre[jetRencontre - 1][6] + " roll) + "
					+ pjOuNon + " (pj modifier) -> " + nbEnnemis);

			texteRencontre = tableRencontre[jetRencontre - 1][1] + " : " + nbEnnemis + ".";

			if (orientation && ($scope.jetDe(20) <= ($scope.data.discretion + tableRencontre[jetRencontre - 1][3]))) {

				texteRencontre += $translate.instant('DAV_REPERE');
			}
		}

		var texteEnnemi = "";
		var jetEnnemi = "N/A";

		var jetDiscretion = $scope.jetDe(20);
		
		$scope.data.logs.push("Enemy - Discretion Roll on Stay On Site ? " + $scope.data.rester + " -> " + jetDiscretion + " <= " + $scope.data.discretion + " (DIS)"
				+ " -> " + (jetDiscretion <= $scope.data.discretion));

		if ($scope.data.rester && jetDiscretion <= $scope.data.discretion) {

			texteEnnemi = $translate.instant('DAV_REPERE');
		} else {

			jetEnnemi = $scope.jetDe(20);
			$scope.data.logs.push("Enemy Roll : " + jetEnnemi + " (roll) + " + modDavokar + " (Davokar Modifier)" + ($scope.data.information ? " - 1 (oral information)" : "")
					+ ($scope.data.sourceEcrite ? " - " + modSourceEcrite + " (written source)" : "")
					+ (orientation && !diffDavokarSurvie ? " - " + (reussiteOrientationSup5 ? "2" : "1") + " (orientation OK and no Davokar/Bushcraft diff)" : ""));

			jetEnnemi += modDavokar;

			if ($scope.data.information)
				jetEnnemi--;

			if ($scope.data.sourceEcrite)
				jetEnnemi - modSourceEcrite

			if (orientation && !diffDavokarSurvie) {

				jetEnnemi--;
				if (reussiteOrientationSup5) jetEnnemi--;
			}

			if (jetEnnemi <= 0) jetEnnemi = 1;
			
			$scope.data.logs.push("Enemy Roll final result : " + jetEnnemi);
					
			if (jetEnnemi > 8) {
				texteEnnemi = $scope.data.pjs + " " + tableEnnemi[jetEnnemi - 9][1] + " (ex. " + tableEnnemi[jetEnnemi - 9][2] + ").";
				//texteEnnemi = jetEnnemi;
			} else {
				texteEnnemi = $translate.instant('DAV_NONE');
			}
		}

		var texteTerrain = "";
		var jetTerrain = "N/A";
		if (!$scope.data.rester) {

			jetTerrain = $scope.jetDe(20);

			$scope.data.logs.push("Terrain Roll : " + jetTerrain + " (roll) + " + modDavokar + " (Davokar Modifier) "
					+ ($scope.data.information ? " - 1 (oral information) " : "")
					+ ($scope.data.sourceEcrite ? " - " + modSourceEcrite + " (written source)" : "")
					+ (orientation && !diffDavokarSurvie ? " - " + (reussiteOrientationSup5 ? "2" : "1") + " (orientation OK and no Davokar/Bushcraft diff)" : ""));

			jetTerrain += modDavokar;

			if ($scope.data.information)
				jetTerrain--;
			
			if ($scope.data.sourceEcrite)
				jetTerrain - modSourceEcrite;
			
			if (orientation && !diffDavokarSurvie) {

				jetTerrain--;
				if (reussiteOrientationSup5)
					jetTerrain--;
			}

			if (jetTerrain <= 0) jetTerrain = 1;

			$scope.data.logs.push("Terrain Roll final result : " + jetTerrain);

			texteTerrain = tableTerrain[jetTerrain - 1][1];
		}

		// ET UN JOUR DE PLUS EN DAVOKAR : Toujours vivant ?
		$scope.data.jours[$scope.data.jour] = {
			davokar: $translate.instant('DAV_' + $scope.data.davokar.toUpperCase()),
			orientation: texteOrientation,
			jetOrientation: jetOrientation,
			provisions: provisions,
			ruine: texteRuine,
			jetRuine: jetRuine,
			rencontre: texteRencontre,
			jetRencontre: jetRencontre,
			ennemi: texteEnnemi,
			jetEnnemi: jetEnnemi,
			terrain: texteTerrain,
			jetTerrain: jetTerrain,
			tresorsRestants: tresorsRestants,
			rester: $translate.instant(('' + $scope.data.rester).toUpperCase()),
			resterBool: $scope.data.rester
		};
		
		$scope.data.jour++;
		
		console.log($scope.data.logs);

		deferred.resolve("ok");
		return deferred.promise;
	}

	$scope.genJour = function () {

		$scope.genJourOut().then(function (value) {

			// Something needed
		});
	}

	$scope.reset = function () {

		$scope.data.jours = [];
		$scope.data.jour = 0;
		$scope.data.provisions = 0;
		$scope.data.tresorsTrouves = [];
		$scope.data.logs = [];
	}

	$scope.jetDe = function (max) {

		return Math.floor(Math.random() * Math.floor(max)) + 1;
	}
});