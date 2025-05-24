class apiResponse{
    constructor(statusCode, data,message, ){
            this.statusCode= statusCode
            this.response = statusCode
            this.success="success"
            this.message=message
            this.data= data
    }
}

export {apiResponse}