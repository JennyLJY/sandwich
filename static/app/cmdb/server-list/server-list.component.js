/**
 * Created by zhangxiaoyu on 2017/5/3.
 */


angular.module('serverList').component('serverList', {
    templateUrl: '/static/app/cmdb/server-list/server-list.template.html',
    controller: ['$http', 'Toastr', function ($http, Toastr) {
        var self = this;
        this.labels = {
            '在线': "label-success",
            '已下线': "label-default",
            '未知': "label-warning",
            '故障': "label-danger",
            '备用': "label-info",
            '报废': "label-default"
        };
        this.num_page = 1;
        this.page = 1;
        this.per_page = 20;
        this.search_input = "";
        this.search = "";
        this.search_data = "";
        this.loading = false;


        this.get_pages = function () {
            var pages = [];
            for (var i = 1; i <= this.num_page; i++) {
                pages.push(i);
            }
            return pages;
        };
        this.is_active = function (p) {
            if (p === self.page) {
                return 'active';
            } else {
                return "";
            }
        };
        this.get_data = function () {
            self.loading = true;
            $http.get('/api/server/list/?page=' + self.page + '&per_page=' + self.per_page + '&search=' + self.search_data).then(function (response) {
                self.servers = response.data.data;
                self.num_page = response.data.total_page;
                self.loading = false;
            }, function (response) {
                // 获取数据失败执行
                if (response.status === 401) {
                    window.location.href = response.data.data.login_url
                }
                self.loading = false;
            });
        };
        this.get_data();
        this.change_page = function (page) {
            if (this.page !== page) {
                this.page = page;
                this.get_data();
            }
        };
        this.search = function (e) {
            self.search_data = self.search_input;
            self.page = 1;
            self.get_data();
        };
        this.previous_page = function (e) {
            if (self.page > 1) {
                self.page -= 1;
            }
        };
        this.next_page = function () {
            if (self.page < self.num_page) {
                self.page += 1;
            }
        };
        this.init_create_form_data = function (form) {
            self.create_form_data = {
                ipaddresses: "",
                port: 22,
                username: "root",
                password: ""
            };
            form.ipaddresses.$dirty = false;
            form.ipaddresses.$pristine = true;
            form.password.$dirty = false;
            form.password.$pristine = true;
        };
        this.create_host = function (form) {
            if (!form.$invalid) {
                var postCfg = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformRequest: function (data) {
                        return $.param(data);
                    }
                };
                var ipaddresses = $('#ipaddresses').val();
                var port = $('#port').val();
                var username = $('#username').val();
                var password = $('#password').val();
                var request_data = {
                    "ipaddresses": ipaddresses,
                    "port": port,
                    "username": username,
                    "password": password
                };
                $http.post("/api/server/create/", request_data, postCfg)
                    .then(function (response) {
                        $.each(response.data.data, function (index, data) {
                            var level = "success";
                            if (data.status) {
                                level = "success";
                            } else {
                                level = "error";
                            }
                            Toastr[level](data.msg, data.ipaddress);
                        });
                    });
            }

        };
        this.delete_host = function (server_id) {
            swal({
				title: "确认删除",
				text: "确认要删除该服务器吗？删除会连同删除所有信息包括操作日志!",
				type: "warning",
				showCancelButton: true,
				confirmButtonColor: "#DD6B55",
				confirmButtonText: "确认删除",
				cancelButtonText: "取消",
				closeOnConfirm: true,
				closeOnCancel: true
			}, function(isConfirm) {
				if(isConfirm) {
				    var postCfg = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformRequest: function (data) {
                        return $.param(data);
                    }
                };
                var request_data = {'server_id':server_id};
                self.loading = true;
                $http.post("/api/server/delete/", request_data, postCfg)
                    .then(function (response) {
                        self.get_data();
                        self.loading = false;
                        Toastr["success"]("删除服务器成功", "成功");
                    }, function (response) {
                        self.loading= false;
                        if (response.status === 401) {
                            window.location.href = response.data.data.login_url
                        }
                        if(response.status===403){
                            Toastr["error"]("对不起，您没有执行此操作的权限", "权限错误");
                        }
                        if(response.status===500){
                            Toastr["error"]("删除服务器失败", "未知错误");
                        }
                        if(response.status===404){
                            Toastr["error"]("要删除的服务器不存在或已被删除", "错误");
                        }
                    });
				}
			});
        };
        // this.init_create_form_data();
    }]
});
