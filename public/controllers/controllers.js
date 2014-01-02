


var appModule = angular.module('appModule', ['ngRoute']);

appModule.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/', {
            templateUrl: '/partials/home.html',
            controller: 'homeController'
        }).
        when('/show/:tag', {
            templateUrl: '/partials/show.html',
            controller: 'showController'
        }).
        when('/map', {
            templateUrl: '/partials/map.html',
            controller: 'mapController'
        }).
        when('/map/:tag', {
            templateUrl: '/partials/map.html',
            controller: 'mapController'
        }).
        otherwise({
            redirectTo: '/'
    });
}]);

appModule.factory('photoGetter', ['$http', function ($http) {
    return photoGetter = {
        getTwoPhotos: function(tag){
            return $http.post('/getTwoPhotos', { tag: tag});
        },
        getOnePhoto: function(tag, photo){
            return $http.post('/getOnePhoto', { tag: tag, photo: photo});
        },
        getPhotosForMap: function(tag){
            return $http.post('/getPhotosForMap', {tag: tag})
        },
        getPhotosForCountry: function(country, tag){
            return $http.post('/getPhotosForCountry', { country: country, tag: tag})
        }
    }
}]);

appModule
    .controller('homeController', ['$scope', '$location', 
        function ($scope, $location) {

            $scope.showPhotosForTag = function(){
                $location.path('/show/' + $scope.showtag);   
            }
            $scope.canSubmitTag = function(){
                 return $scope.homeTagForm.$dirty && $scope.homeTagForm.$valid;
            }

            $scope.showPhotosOnMap = function(){
                $location.path('/map/' + $scope.maptag);
            }

            $scope.canSubmitMap = function(){
                return $scope.homeMapForm.$dirty && $scope.homeMapForm.$valid;
            }

        }])

appModule
    .controller('showController', ['$scope', '$location', 'photoGetter', '$routeParams', '$http', 
        function ($scope, $location, photoGetter, $routeParams, $http) {

            $scope.tag = $routeParams.tag;
            $scope.photos = false;

            photoGetter.getTwoPhotos($routeParams.tag)
               .then(function(response){
                    $scope.photos = response.data;
                 }, 
                 function(){
                    $scope.error = true;
                 })
              

            $scope.requestTwoPhotos = function(){
                if ($routeParams.tag !== $scope.tag) {
                    $scope.error = false;
                    $scope.photos = false;
                    $location.path('/show/' + $scope.tag); 
                }
                else {
                    $scope.error = false;
                    $scope.photos = false;
                    photoGetter.getTwoPhotos($routeParams.tag)
                       .then(function(response){
                            $scope.photos = response.data;
                         }, 
                        function(){
                            $scope.error = true;
                         })
                    }
                }

            $scope.removePhoto = function(photo){
                $scope.loading = true;
                $scope.photos.forEach(function (p, i) {
                    if (photo.id === p.id) {
                        $scope.photos.splice(i, 1);
                        
                    }
                })

                var tag = $scope.tag || $routeParams.tag
                photoGetter.getOnePhoto(tag, photo)
                    .then(function(response){
                        $scope.photos.push(response.data[0]);
                    },
                    function(){
                        $scope.error = true;
                    })
                }

            $scope.voteOnPhoto = function(photo){
                $scope.photos = false;
                $scope.loading = true;

                var tag = $scope.tag || $routeParams.tag;
                $http.post('/voteOnPhoto', {photo: photo, tag: tag})
                   .success(function(data){
                       $scope.loading = false;
                       $scope.photos = data;
                   })
                   .error(function(){
                       $scope.loading = false;
                       $scope.error = true;
                    })
                }

            $scope.canSearch = function(){
                return $scope.searchPhotoForm.$valid;
            }
        }])

appModule.controller("mapController", ['$scope', '$location', 'photoGetter', '$routeParams', '$http', 
    function($scope, $location, photoGetter, $routeParams, $http) {

    if ($routeParams) {
      $scope.tag = $routeParams.tag;
      var tag = $routeParams.tag;
      photoGetter.getPhotosForMap(tag)
        .then(function(response){
            $scope.markers = $scope.originalMarkers = response.data;
            },
            function(){ $scope.error = true;})
    }

    $scope.getPhotosForMap = function(){
        if ($routeParams.tag !== $scope.tag){
            $location.path('/map/' + $scope.tag)
        }
        else {
            photoGetter.getPhotosForMap($routeParams.tag)
            .then(function(response){
                $scope.markers = response.data;
                $scope.originalMarkers = response.data;
            }, 
            function(){ $scope.error = true;}
            )
        }
    }

    $scope.canSearch = function(){
        return $scope.showMapForm.$valid;
    }

    $scope.filterMarkers = function(){
        $scope.loading = true;
        var pcent = Number($scope.percentage);
        var copy = $scope.originalMarkers;
        var fresh = {};
        for (var key in copy){
            var obj = copy[key];
            if (Number(obj.ranking) >= pcent){
               fresh[key] = obj;
            }
        } 
        $scope.markers = fresh;
    }

    $scope.canFilter = function(){
        return $scope.filterMarkersForm.$dirty && $scope.filterMarkersForm.$valid;
    }

    //$scope.getGeoJson = function(){
        $http.get('/worldjson')
            .success(function(data){
                $scope.geojson = data;
            });
       // }

    $scope.$on('country.click', function(e, l){
        var country = l.target.feature.id;
        console.log(country);
        $scope.photos = false;
        photoGetter.getPhotosForCountry(country, $routeParams.tag)
        .then(function(response){
            console.log(response);
            $scope.photos = response.data;
        })
    });
}]);

appModule.directive('map', function($rootScope) {
    return {
        replace: true,
        template: '<div></div>',
        link: function(scope, element, attrs) {
            map = L.mapbox.map(attrs.id, 'grabbeh.gch0omlb',{
                center: [33, 31],
                zoom: 2,
                minZoom: 1
            });

            var clusterer = L.markerClusterGroup();
            var markers = [];

            function updatePoints(pts) {
               clusterer.clearLayers(markers);
               for (var p in pts) {
                  var marker = L.marker([pts[p].lat, pts[p].lng]);
                  marker.bindPopup(pts[p].message, { maxWidth: 10000});
                  markers.push(marker);
                  clusterer.addLayer(marker);
               }
               map.addLayer(clusterer);
            }

            function updateGeoJson(gjson){
                L.geoJson(gjson, 
                    { 
                style: {
                       "color": "white",
                        "weight": 0,
                        "opacity": 0 
                },
                onEachFeature: function (feature, layer) {
                     layer.on('click', function(e){
                        $rootScope.$broadcast('country.click', e);

                        //var lay = e.target;
                        //console.log(lay.feature.id);
                    })
            }}).addTo(map)
            }
                
            scope.$watch(attrs.markers, function(value) {
                 updatePoints(value);
            });

            scope.$watch(attrs.geojson, function(value){
                updateGeoJson(value);
            })
        }
    };
});

appModule.directive('loading', function($rootScope) {
  return {
    link: function(scope, element, attrs) {
      element.addClass('hide');

      $rootScope.$on('$routeChangeStart', function() {
        element.removeClass('hide');
      });

      $rootScope.$on('$routeChangeSuccess', function() {
        element.addClass('hide');
      });
    }
  };
});

