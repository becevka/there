module.exports = function (config) {
    config.phrases = {
        '$ or $': '$1 || $2',
        'when $ is $ $': '($1, $2) .. { $ }'

    };
};