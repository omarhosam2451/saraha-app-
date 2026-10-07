export default class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    createNewDocument(data) {
        return this.model.create(data);
    }

    findOneDocument(filters = {}) {
        return this.model.findOne(filters);
    }

    findAndUpdateDocument(filters, updates, options = { new: true }) {
        return this.model.findOneAndUpdate(filters, updates, options);
    }
}