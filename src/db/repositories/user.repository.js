import User from "../models/User.model.js";
import BaseRepository from "./baseRepo.js";



export default class UserRepository extends BaseRepository{
     constructor(){
        super(User)
     }
     findUserByEmailHash(emailLookupHash){
        return this.findOneDocument({emailLookupHash})
     }
}