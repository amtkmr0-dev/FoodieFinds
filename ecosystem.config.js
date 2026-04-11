export default {
    apps: [
        {
            name: 'foodiefinds',
            script: './dist/index.js',
            cwd: '/var/www/foodiefinds/current',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 5000
            },
            error_file: '/var/log/foodiefinds/error.log',
            out_file: '/var/log/foodiefinds/out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true
        }
    ]
};
