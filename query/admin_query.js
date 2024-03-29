const Admins = require("../models/admins")
const AdminActivityLog = require("../models/adminActivity")
const Logs = require("../models/logs")
const Establishments = require("../models/establishments")
const bcrypt = require("bcryptjs")
const idGenerator = require("../services/id_generator")

async function getAdmin(id) {
    try {
        const admin = await Admins.findOne({ username: id })
        if (admin) return admin
        return null
    } catch (err) {
        console.log(err.message)
        return null
    }
}

async function getAllAdmin() {
    try {
        const admin = await Admins.find({})
        if (admin) return admin
        return null
    } catch (err) {
        console.log(err.message)
        return null
    }
}

async function createAdmin(data) {
    var adminData = data

    //hash password of the new admin using bcrypt
    const hashedPassword = await bcrypt.hash(adminData.password, 10)

    //assign hashed password to adminData.password
    adminData.password = hashedPassword

    const adminId = await idGenerator.adminId()
    adminData.username = adminId

    try {
        const newAdmin = await Admins.create(adminData)
        if (newAdmin) return newAdmin
        return null
    } catch (err) {
        console.log(err.message)
        return null
    }
}

async function updateAdmin(username, password) {
    try {
        const admin = await getAdmin(username)

        if (admin) {
            const hashedPassword = await bcrypt.hash(password, 10)

            const updatedAdmin = Admins.updateOne(
                { username: username },
                { password: hashedPassword }
            )
            return updatedAdmin
        }
        return null
    } catch (err) {
        console.log(err.message)
        return null
    }
}

async function getAdminLogs() {
    try {
        var adminLogs = await AdminActivityLog.find({})
            .sort("-dateTime")
            .limit(4)
        if (adminLogs) return adminLogs
        return null
    } catch (err) {
        console.log(err.message)
        return null
    }
}

async function getScanCount(dateTime) {
    try {
        var date = new Date(dateTime.slice(0, 10))
        var tempDate = new Date(date)
        var plusDate = new Date(tempDate.setDate(tempDate.getDate() + 1))
        var count = await Logs.count({
            dateTime: {
                $gte: date,
                $lte: plusDate,
            },
        })
        if (count) return count
        return null
    } catch (err) {
        console.log(err.message)
        return null
    }
}

async function getAdminEstablishments(match) {
    try {
        var establishments = await Establishments.find({})

        establishments = matchEstablishmentSearch(establishments, match)

        if (establishments) return establishments
        return null
    } catch (err) {
        console.log(err.message)
        return null
    }
}

async function getAdminUserLogs(dateTime, match) {
    try {
        var date = new Date(dateTime)
        var tempDate = new Date(date)
        var plusDate = new Date(tempDate.setDate(tempDate.getDate() + 1))

        date = date.toISOString().substring(0, 10)
        plusDate = plusDate.toISOString().substring(0, 10)

        var adminUserLogs = await Logs.find({
            dateTime: {
                $gte: date,
                $lte: plusDate,
            },
        }).populate([
            {
                path: "establishment",
                select: ["establishmentName"],
            },
            {
                path: "user",
                select: ["firstname", "lastname"],
            },
        ])

        adminUserLogs = matchSearch(adminUserLogs, match)

        if (adminUserLogs) return adminUserLogs
        return null
    } catch (err) {
        console.log(err.message)
        return null
    }
}

function matchEstablishmentSearch(est, match) {
    var establishments = []
    var reg = new RegExp(match, "i")

    est.map((value) => {
        if (reg.test(value.establishmentName)) {
            var address = ""
            if (value.street != "") {
                address =
                    value.street +
                    ", " +
                    value.barangay +
                    ", " +
                    value.cityMun +
                    ", " +
                    value.province
            } else {
                address =
                    value.barangay +
                    ", " +
                    value.cityMun +
                    ", " +
                    value.province
            }
            establishments.push({
                establishmentId: value.establishmentId,
                establishmentName: value.establishmentName,
                address: address,
            })
        }
    })
    return establishments
}

function matchSearch(logs, match) {
    var adminUserLogs = []
    var reg = new RegExp(match, "i")

    logs.map((value) => {
        var firstname = value.user.firstname
        var lastname = value.user.lastname

        if (reg.test(firstname) || reg.test(lastname)) {
            adminUserLogs.push(value)
        }
    })
    return adminUserLogs
}

module.exports = {
    getAdmin,
    createAdmin,
    updateAdmin,
    getAdminLogs,
    getAdminUserLogs,
    getAdminEstablishments,
    getScanCount,
    getAllAdmin,
}
