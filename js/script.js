var github = {
  api : 'https://api.github.com',
  user : 'webandlaw',
  repo : 'NihonkokuKempo'
}


$(function(){
  if(document.location.search.length > 3){
      new pageScript();
  }else{
      topScript();
  }
});

var topScript = function(){
  $('#page').remove();

  $.ajax({
    url : [github.api+'/repos/',github.user,'/',github.repo,'/git/trees/master?recursive=1'].join(''),
    dataType: 'jsonp'
  }).then(function(json){
    var data = json.data.tree,
        $nav = $('#nav'),
        c = new Showdown.converter;
    for (var i = 0 ,l = data.length; i < l; i++) {
      var path = data[i].path.split('/'),
          filename = path.pop(),
          dir = path[0];
      if (dir == 'constitution' && filename.split('.').pop() == 'md'){
        $.when(filename, ajaxDfd('constitution/'+filename)).then(function(filename, d){
          $nav.prepend([
            '<li>',
              '<a href="?md=',filename.split('.')[0],'">',$(c.makeHtml(d)).filter("h1").text(),'</a>',
            '</li>'
          ].join(''));
        });
      }
    }
  });
}


var ajaxDfd = function(url){
  var dfd = $.Deferred();
  $.ajax(url).then(function(data){
    dfd.resolve(data);
  },function(data){
    dfd.reject(data);
  });
  return dfd.promise();
}


var pageScript = (function(){
  function pageScript(){
    this.$page = $("#page");
    this.$branches = this.$page.find('#branches');
    this.$target = this.$page.find('#target');
    this.$master = this.$page.find('#master');
    this.$compare = this.$page.find('#compare');

    this.c = new Showdown.converter;

    mdName = document.location.search.replace("?md=", '');
    this.mdPath = (mdName === 'README')? mdName+".md" : 'constitution/'+mdName+".md";

    this.initialize();
  }

  pageScript.prototype = {

    initialize: function(){
      $('#top').remove();
      this.renderBranchMd('gh-pages',this.mdPath);
      this.setBranchesList();
    },

    setBranchesList: function(){
      var _this = this;
      $.ajax({
        url: [github.api+'/repos/',github.user,'/',github.repo,'/branches'].join(''),
        dataType: 'jsonp'
      }).then(function(json){
        var data = json.data;
        for (var i = 0 ,l = data.length; i < l; i++) {
          _this.$branches.prepend([
            '<li>',
              '<a href="#',data[i].name,'">',data[i].name,'</a>',
            '</li>'
          ].join(''));
        }
        _this.setBranchClickEvent();
      })
    },

    setBranchClickEvent: function(){
      var _this = this;
      this.$branches.find('a').on('click',function(){
        var branch = $(this).attr('href').split('#')[1];
        _this.renderBranchMd(branch);
        return false;
      })
    },

    renderBranchMd: function(branch, baseUrl){
      var _this = this;
      $.ajax({
        url : [github.api+'/repos/',github.user,'/',github.repo,'/git/trees/',branch,'?recursive=1'].join(''),
        dataType: 'jsonp'
      }).then(function(json){
        console.log(json);
        var data = json.data.tree;
        for (var i = 0 ,l = data.length; i < l; i++) {
          if(data[i].path == _this.mdPath){
            _this.setCompare(data[i].url, baseUrl).then(function(data1, data2){
              _this.$target.prepend(_this.c.makeHtml(data1));
              if(data2){
                _this.$master.prepend(_this.c.makeHtml(data2));
                document.title = _this.$master.find("h1").text();
              }
            });
            return false;
          }
        }
      });
    },

    setCompare: function(blobUrl, masteUrl){
      var dfd = $.Deferred(), targetText, _this = this;
      if(masteUrl){
        _this.$compare.mergely({
            cmsettings: { readOnly: false, lineWrapping: true }
        });
        $.when(
          ajaxDfd(masteUrl),
          ajaxDfd(blobUrl)
        ).then(function(mdText, json){
          targetText = $.base64.decode(json.content ,true);
          _this.$compare.mergely('lhs', mdText);
          _this.$compare.mergely('rhs', targetText);
          dfd.resolve(targetText,mdText);
        });

      }else{
        ajaxDfd(blobUrl).then(function(json){
          targetText = $.base64.decode(json.content ,true);
          this.$compare.mergely('rhs', targetText);
          dfd.resolve(targetText);
        });
      }
      return dfd.promise();
    }
  };

  return pageScript;
})();




