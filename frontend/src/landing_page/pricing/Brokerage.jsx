export default function Brokerage() {
    return (
        <div className="container mt-5 mb-5 pb-5">
            <h3 className="fs-4 mb-4" style={{color:"var(--secondary-color, #424242)"}}>Charges for account Opening</h3>
            <div className="table-responsive">
                <table className="table border text-muted align-middle">
                    <thead>
                        <tr className="text-dark" style={{backgroundColor:"#fafafa"}}>
                            <th className="py-3 px-4 fw-medium">Types of account</th>
                            <th className="py-3 px-4 fw-medium">Charges</th>
                        </tr>
                    </thead>
                    <tbody className="text-muted">
                        <tr className="">
                            <td className="py-2 px-4 text-muted">Individual account</td>
                            <td className="py-2 px-4 ">
                                <span className="badge bg-success px-2 py-1">FREE</span>
                            </td>
                        </tr>
                         <tr className="">
                            <td className="py-2 px-4 text-muted">Minor account</td>
                            <td className="py-2 px-4">
                                <span className="badge bg-success px-2 py-1">FREE</span>
                            </td>
                        </tr>
                        <tr className="">
                            <td className="py-2 px-4 text-muted">NRI account</td>
                            <td className="py-2 px-4 text-muted">
                               ₹ 500
                            </td>
                        </tr>
                        <tr className="">
                            <td className="py-2 px-4 text-muted">HUF account</td>
                            <td className="py-2 px-4 text-muted">
                                <span className="badge bg-success px-2 py-1">FREE</span>  (online) / ₹ 500 (offline)
                            </td>
                        </tr>
                        <tr className="">
                            <td className="py-2 px-4 text-muted">Partnership, LLP, and Corporate accounts (offline only)</td>
                            <td className="py-2 px-4">
                                <span className="badge bg-success px-2 py-1">FREE</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
        </div>
    );
}