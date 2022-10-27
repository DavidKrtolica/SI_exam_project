let users = [
    { name: 'Alpha', email: 'alpha@gmail.com', room: 'SW2022', registered: undefined, socketId: undefined },
    { name: 'Beta', email: 'beta@gmail.com', room: 'SW2022', registered: undefined, socketId: undefined },
    { name: 'Gamma', email: 'gamma@gmail.com', room: 'SW2022', registered: undefined, socketId: undefined },
    { name: 'Delta', email: 'delta@gmail.com', room: 'SW2022', registered: undefined, socketId: undefined },
];

export const addUser = (name, room, socketId) => {
    const user = users.find((user) => {
        return user.room == room && user.name == name
    });

    if (!user) {
        return { error: 'This name does not exist in the database :(' };
    }

    if (!user.registered) {
        user.registered = 1;
    }

    user.socketId = socketId;

    return { user };
}

export const removeUser = (socketId) => {
    return users.find(user => {
        return user.socketId === socketId
      })
}

export const markUserAsDisconnected = (socketId) => {
    users.map((user) => {
        if (user.socketId === socketId) {
            user.socketId = undefined;
        }
    })
}

export const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room);
}

export const addUserToDatabase = ({ name, email }) => {
    const userExists = getUser(email);
    if (userExists) {
        return false;
    }
    users = [...users, { name, email, room: 'SW2022', registered: undefined, socketId: undefined }];
    return true;
}

export const getUser = (email) => {
    return users.find((user) => {
        return user.email === email;
    })
}
