export default function Hero() {
    return (
        <div className="p-md-4 p-3 "  style={{backgroundColor:"#F6F6F6"}} >
            <div className="d-flex justify-content-between align-items-center">
            <div><h1>Support Portal</h1></div>
            <div> <button className="btn btn-primary py-2 px-3">My tickets</button></div>
            </div>
            <div className="mt-md-4 mt-2 mb-md-3 mb-1">
            <input type="text" placeholder="Eg: How do I open my account, How do i activate F&O ..." className="form-control mt-4 p-3 w-100"/>
            </div>
        </div>
    );
}