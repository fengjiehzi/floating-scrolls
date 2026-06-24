// auth.js - 登录注册辅助逻辑
const Auth = {
    selectedAvatar: '\u{1F3AD}',

    // 初始化
    init() {
        this.initAvatarPicker();
    },

    // 初始化头像选择器
    initAvatarPicker() {
        const options = document.querySelectorAll('.avatar-option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                options.forEach(o => o.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.selectedAvatar = e.currentTarget.dataset.avatar || '🎭';
            });
        });
    },

    // 获取当前选择的头像
    getSelectedAvatar() {
        const active = document.querySelector('.avatar-option.active');
        return active ? active.dataset.avatar : this.selectedAvatar;
    }
};
