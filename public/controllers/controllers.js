var appModule = angular.module('appModule', []);

appModule.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/', {
            templateUrl: '/partials/home.html',
            controller: 'homeController'
        }).
        when('/show', {
            templateUrl: '/partials/show.html',
            controller: 'showController'
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
    .controller('showController', ['$scope', '$location', '$routeParams', '$http', 
        function ($scope, $location, $routeParams, $http) {
        $scope.loading = false;
        $scope.error = false;

        if ($routeParams.tag){
            $scope.tag = $routeParams.tag;
            $scope.loading = true;
            $scope.photos = false;
            $http.post('/requestTwoPhotos', { tag: $routeParams.tag })
                .success(function(data){
                    $scope.loading = false;
                    $scope.photos = data;
                 })
                .error(function(){
                    $scope.loading = false;
                    $scope.error = true;
                 })
              }

            $scope.requestTwoPhotos = function(){
                
                if ($routeParams.tag !== $scope.tag) {
                    $scope.error = false;
                    $scope.photos = false;
                    $scope.loading = true;
                    $location.path('/show/' + $scope.tag); 
                }
                else {
                    $scope.error = false;
                    $scope.loading = true;
                    $scope.photos = false;
                    $http.post('/requestTwoPhotos', { tag: $routeParams.tag })
                        .success(function(data){
                            $scope.loading = false;
                            $scope.photos = data;
                         })
                        .error(function(){
                            $scope.loading = false;
                            $scope.error = true;
                         })
                    }
                }

            $scope.removePhoto = function(photo){
                $scope.loading = true;
                $scope.photos.forEach(function (p, i) {
                    if (photo.id === p.id) {
                        $scope.photos.splice(i, 1);
                        $http.post('/requestOnePhoto', { tag: $scope.tag || $routeParams.tag, photo:photo })
                            .success(function(data){
                                $scope.loading = false;
                                $scope.photos.push(data[0]);
                        })
                        .error(function(){
                            $scope.loading = false;
                            $scope.error = true;
                         })    
                    }
                })
            }

            $scope.voteOnPhoto = function(photo){
                $scope.photos = false;
                $scope.loading = true;
                var postData = {
                    photo: photo,
                    tag: $scope.tag || $routeParams.tag
                }
                $http.post('/voteOnPhoto', postData)
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
                return $scope.searchPhotoForm.$dirty && $scope.searchPhotoForm.$valid;
            }
        }])

appModule.controller("mapController", ['$scope', '$location', '$routeParams', '$http', function($scope, $location, $routeParams, $http) {
    $scope.markers = {};
    
    if ($routeParams) {
      $scope.loading = true;
      $scope.error = false;
      $scope.tag = $routeParams.tag;
      $http.post('/getPhotosForMap', {tag: $routeParams.tag })
            .success(function(data){
                $scope.loading = false;
                $scope.markers = data;
                $scope.originalMarkers = data;
            })
            .error(function(){
                $scope.loading = false;
                $scope.error = true;
            })
    }

    $scope.getPhotosForMap = function(){
        if ($routeParams.tag !== $scope.tag){
        $location.path('/map/' + $scope.tag)
        }
        else {
            $scope.loading = true;
            $http.post('/getPhotosForMap', {tag: $routeParams.tag })
            .success(function(data){
                $scope.loading = false;
                $scope.markers = data;
                $scope.originalMarkers = data;
            })
            .error(function(){
                $scope.loading = false;
                $scope.error = true;
            })
        }
    }

    $scope.canSearch = function(){
        return $scope.showMapForm.$valid;
    }

    $scope.filterMarkers = function(){
        $scope.loading = true;
        $scope.error = false;
        var i = 0;
        var pcent = Number($scope.percentage);
        console.log("Percentage = " + pcent)
        var copy = $scope.originalMarkers;
        console.log("Copy length = " + Object.keys(copy).length)
        var fresh = {};
        for (var key in copy){
            var obj = copy[key];
            console.log("Looping")
            console.log("Single object = " + obj)
            if (Number(obj.ranking) >= pcent){
               fresh[key] = obj;
            }
        } 
        console.log("Fresh length = " + Object.keys(fresh).length)
        $scope.loading = false;
        $scope.markers = fresh;
        console.log(Object.keys($scope.markers).length)
    }

    $scope.canFilter = function(){
        return $scope.filterMarkersForm.$dirty && $scope.filterMarkersForm.$valid;
    }
}]);

appModule.directive('map', function() {
    return {
        restrict: 'E',
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
            scope.$watch(attrs.markers, function(value) {
                 console.log(Object.keys(value).length);
                 updatePoints(value);
            });
        }
    };
});



