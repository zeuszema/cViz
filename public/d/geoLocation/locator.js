angular.module("locator", []), angular.module("locator").directive("locationLookup", [function() {
    return {
        restrict: "E",
        require: "?ngModel",
        templateUrl: "location-lookup/location-lookup.html",
        scope: {},
        link: function(e, o, t, n) {
            e.limitTo = e.$eval(t.limitTo) || 15, e.callback = e.$eval(t.callback), e.results = [];
            var a = document.createElement("div");
            a.setAttribute("id", e.ID);
            var r = new google.maps.places.PlacesService(o[0].appendChild(a));
            e.clear = function() {
                e.results = []
            }, e.pickLocation = function(o) {
                r.getDetails({
                    reference: o.reference
                }, function(t) {
                    e.$apply(function() {
                        var a = {
                            name: o.terms[0].value,
                            description: o.description,
                            latitude: t.geometry.location.lat(),
                            longitude: t.geometry.location.lng()
                        };
                        n.$setViewValue(a), e.callback && e.callback(a)
                    })
                })
            }
        }
    }
}]), angular.module("locator").directive("locationPredictions", [function() {
    return {
        restrict: "E",
        scope: {
            results: "="
        },
        template: '<input type="text" placeholder="search for a location">',
        link: function(e, o) {
            var t = new google.maps.places.AutocompleteService,
                n = angular.element(o.find("input")),
                a = function(e) {
                    t.getPlacePredictions({
                        input: e
                    }, r)
                },
                r = function(o, t) {
                    return t !== google.maps.places.PlacesServiceStatus.OK ? (e.$apply(function() {
                        e.results = []
                    }), void 0) : (e.$apply(function() {
                        e.results = o
                    }), void 0)
                };
            n.on("input", function() {
                var o = n.val();
                o && o.length >= 3 ? a(o) : e.$apply(function() {
                    e.results = []
                })
            })
        }
    }
}]), angular.module("locator").directive("locationPicker", ["$log", "location", "reverseGeocoder", function(e, o, t) {
    return {
        restrict: "E",
        require: "?ngModel",
        scope: {},
        templateUrl: "location-picker/location-picker.html",
        link: function(n, a, r, i) {
            n.limitTo = n.$eval(r.limitTo) || 15, o.ready(function() {
                t.geocode(o.current).then(function(e) {
                    n.options = e
                }, e.error)
            }), n.pickLocation = function(e) {
                var e = {
                    latitude: o.current.latitude,
                    longitude: o.current.longitude,
                    name: e.address_components[0].short_name,
                    description: e.formatted_address
                };
                i.$setViewValue(e)
            }
        }
    }
}]), angular.module("locator").factory("location", [function() {
    var e = {
            isReady: !1,
            gpsAvailable: !0
        },
        o = [];
    return e.get = function(o, t) {
        navigator.geolocation.getCurrentPosition(function(t) {
            e.gpsAvailable = !0, e.current = {
                latitude: t.coords.latitude,
                longitude: t.coords.longitude
            }, e.isReady = !0, e.onReadyTasks(), o()
        }, function(o) {
            e.gpsAvailable = !1, console.log("code: " + o.code + " message: " + o.message), t()
        })
    }, e.onReadyTasks = function() {
        for (var e = o.length - 1; e >= 0; e--) o[e]()
    }, e.ready = function(t) {
        e.isReady ? t() : o.push(t)
    }, e
}]), angular.module("locator").factory("reverseGeocoder", ["$document", "$q", function(e, o) {
    var t = {};
    return e.ready(function() {
        t.geocoder = new google.maps.Geocoder
    }), t.geocode = function(e) {
        var n = o.defer();
        if (e) var a = new google.maps.LatLng(e.latitude, e.longitude);
        else n.reject("You need to provide LatLng");
        return t.geocoder.geocode({
            latLng: a
        }, function(e, o) {
            return o !== google.maps.GeocoderStatus.OK ? (n.reject("No locations found"), void 0) : (n.resolve(e), void 0)
        }), n.promise
    }, t
}]);
