// pages/my/my.js
const app = require('../../app.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        showModal: false,
        currentAction: '',
        avatarUrl: '',
        nicknameInput: '',
        nickname: 'nickname_not_updated', // 从用户信息中获取的昵称
        username: '', // 从用户信息中获取的用户名
        imagePreview: [], // 用于存储图片预览的数组
        unique: 0, // 添加一个唯一标识符，用于wx:key

        profilePicUrl: '../../images/my-icon.png',
        tempImagePath: '', // Add this to store temporary image path
        defaultPicUrl: '../../images/my-icon.png'
    },

    updateProfilePicDisplay(username) {
        // First check if we have a profile picture URL
        const profilePicUrl = global.api.getProfilePicture(username);

        // If the URL is null/undefined/empty, use default immediately
        if (!profilePicUrl) {
            this.setData({
                profilePicUrl: this.data.defaultPicUrl
            });
            return;
        }

        // Verify if the URL is accessible
        wx.request({
            url: profilePicUrl,
            method: 'HEAD',
            success: (res) => {
                this.setData({
                    profilePicUrl: res.statusCode === 200 ? profilePicUrl : this.data.defaultPicUrl
                });
            },
            fail: () => {
                this.setData({
                    profilePicUrl: this.data.defaultPicUrl
                });
            }
        });
    },


    handleImageError(e) {
        this.setData({
            profilePicUrl: this.data.defaultPicUrl
        });
    },

    /**
     * 跳转我的跑步记录页面
     */
    navigateToRecord: function () {
        wx.navigateTo({
            url: '../runrecord/runrecord' // 确保路径正确
        });
    },

    showModal: function (e) {
        const action = e.currentTarget.dataset.action;
        this.setData({
            showModal: true,
            currentAction: action
        });
    },

    hideModal: function () {
        this.setData({
            showModal: false,
            currentAction: ''
        });
    },
    /**
     * 获取输入的新昵称
     *  */

    inputNickname: function (e) {
        this.setData({
            nicknameInput: e.detail.value
        });
    },

    /**
     * 选择头像，并进行显示，限定一张
     */
    chooseAvatar: function (e) {
        const username = wx.getStorageSync('username');
        if (!username) {
            wx.showToast({
                title: '请先登录',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const tempFilePath = res.tempFilePaths[0];

                // Store the temporary file path and show modal
                this.setData({
                    tempImagePath: tempFilePath,
                    showModal: true,
                    currentAction: 'avatar'
                });
            },
            fail: (err) => {
                console.error('Failed to choose image:', err);
                wx.showToast({
                    title: '选择图片失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 点击弹窗的确认
     */
    onModalSuccess: function () {
        if (this.data.currentAction === 'nickname') {
            const newNickname = this.data.nicknameInput;
            const username = wx.getStorageSync('username');

            // Check if the nickname is not empty
            if (newNickname.trim() !== '') {
                // Update the page's nickname
                this.setData({
                    nickname: newNickname
                });

                const nickname = newNickname;

                // Call the editNickname API
                global.api.updateNickname(username, nickname)
                    .then(() => {
                        // Optional: Additional actions after successful nickname update
                        wx.showToast({
                            title: '昵称已更新',
                            icon: 'success'
                        });
                    })
                    .catch((error) => {
                        // Handle update errors if needed
                        console.error('Nickname update failed:', error);
                    });

                // Close the modal (if applicable)
                this.setData({
                    currentAction: '' // Reset the action to close the modal
                });
            } else {
                wx.showToast({
                    title: '请输入有效的昵称',
                    icon: 'none'
                });
            }

            // 执行修改昵称的逻辑
            console.log('新昵称:', this.data.nickname);
        } else if (this.data.currentAction === 'avatar' && this.data.tempImagePath) {
            const username = wx.getStorageSync('username');

            wx.showLoading({
                title: '上传中...'
            });

            global.api.updateProfilePicture(username, this.data.tempImagePath)
                .then(() => {
                    // Success handling
                    const newProfilePicUrl = global.api.getProfilePicture(username);
                    wx.setStorageSync('profilePicUrl', newProfilePicUrl)
                    this.setData({
                        profilePicUrl: newProfilePicUrl + '?t=' + new Date().getTime()
                    });
            
                    wx.showToast({
                        title: '头像已更新',
                        icon: 'success',
                        duration: 2000
                    });
                })
                .catch((error) => {
                    console.error('Upload error details:', error);
                    wx.showToast({
                        title: '上传失败，请重试',
                        icon: 'none',
                        duration: 2000
                    });
                })
                .finally(() => {
                    wx.hideLoading();
                    this.setData({
                        tempImagePath: ''
                    });
                });
        }


        this.hideModal();
    },

    onModalFail: function () {
        // Clear the temporary image path if user cancels
        if (this.data.currentAction === 'avatar') {
            this.setData({
                tempImagePath: ''
            });
        }
        console.log('用户点击了取消');
        this.hideModal();
    },

    /**
     * 登出函数
     */
    onLogout: function () {
        wx.clearStorageSync('token');
        wx.redirectTo({
            url: '../index/index',
        });
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        app.tokenCheck();
        const username = wx.getStorageSync('username');
        const nickname = wx.getStorageSync('nickname');
        const profilePicUrl = global.api.getProfilePicture(username);
        console.log(profilePicUrl);
        this.setData({
            username: username,
            nickname: nickname,
            profilePicUrl: profilePicUrl
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})