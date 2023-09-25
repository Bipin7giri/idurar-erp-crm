const mongoose = require('mongoose');
const Model = mongoose.model('Tax');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Tax');

delete methods['delete'];

methods.create = async (req, res) => {
    try {
        const { isDefault, ...rest } = req.body;

        if (isDefault) {
            await Model.updateMany({}, { isDefault: false });
        }
        const result = await new Model({ isDefault, ...rest }).save();
        return res.status(200).json({
            success: true,
            result: result,
            message: 'Tax created successfully',
        });
    } catch (err) {
        // If err is thrown by Mongoose due to required validations
        if (err.name == 'ValidationError') {
            return res.status(400).json({
                success: false,
                result: null,
                message: 'Required fields are not supplied',
            });
        } else {
            // Server Error
            return res.status(500).json({
                success: false,
                result: null,
                message: 'Oops there is an Error',
            });
        }
    }
}

methods.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { isDefault, enabled, ...rest } = req.body;

        // if isDefault:false , we update first - isDefault:true
        // if isEnabled:false and isDefault:true , we update first - isDefault:true
        if (!isDefault || !enabled && isDefault) {
            await Model.findOneAndUpdate({ _id: { $ne: id } }, { isDefault: true });
        }

        // if isDefault:true and isEnable:true, we update other taxes and make is isDefault:false
        if (isDefault && enabled) {
            await Model.updateMany({}, { isDefault: false });
        }

        const taxesCount = await Model.estimatedDocumentCount();

        // if isEnabled:false and it's only one exist, we can't disable
        if (!enabled && taxesCount <= 1) {
            return res.status(422).json({
                success: false,
                result: null,
                message: 'You cannot disable the tax because it is the only existing one',
            })
        }

        const result = await Model
            .findOneAndUpdate(
                { '_id': id },
                { isDefault, enabled, ...rest },
                { new: true });

        return res.status(200).json({
            success: true,
            message: 'Tax updated successfully',
            result,
        });

    } catch (err) {
        // If err is thrown by Mongoose due to required validations
        if (err.name == 'ValidationError') {
            return res.status(400).json({
                success: false,
                result: null,
                message: 'Required fields are not supplied',
            });
        } else {
            // Server Error
            return res.status(500).json({
                success: false,
                result: null,
                message: 'Oops there is an Error',
            });
        }
    }
}

module.exports = methods;
