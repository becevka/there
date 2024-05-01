module.exports = function (config) {
    config.phrases = {
        '$ should be $': '$1 should $2',
        '$ should eq $': '$1 should $2'
    };
    config.index = 'index';
};
