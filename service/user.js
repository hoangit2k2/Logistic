import CarFleet from "../model/CarFleet.js"
import Customer from "../model/Customer.js"
import Department from "../model/Department.js"
import Staff from "../model/Staff.js"

export const handleUser = async user => {
    if (!user) return user
    const deepUser = { ...user._doc }

    try {
        const [isStaff, isCustomer] = await Promise.all(
            [
                Staff.exists({ _id: user.role }),
                Customer.exists({ _id: user.role })
            ]
        )
        user = await user.populate(
            {
                path: 'role',
                model: isStaff ? Staff : (isCustomer ? Customer : "")
            }
        )
        if (isStaff) {
            user = await user.populate(
                [
                    {
                        path: 'role.department',
                        model: Department
                    },
                    {
                        path: 'role.car_fleet',
                        model: CarFleet
                    }
                ]
            )
        }
        return { ...user._doc }
    } catch (error) {
        console.log(error)
        return deepUser
    }
}