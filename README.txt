run command:
    cd backend

install:
    yarn install
    yarn update

run:
    - dev: 
        nodemon
        yarn run dev

    - product:
        yarn start
        node index.js