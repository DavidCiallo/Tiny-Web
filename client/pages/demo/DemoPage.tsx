import { Header } from "../../components/header/Header";
import { useEffect, useState } from "react";
import { Locale } from "../../methods/locale";
import { AccountDTO, AccountListRequest } from "../../../shared/modules/account/account.interface";
import { AccountRouter } from "../../api/instance";

const DemoPage = () => {
    const [DemoList, setDemoList] = useState<Array<AccountDTO>>([]);

    useEffect(() => {
        (async () => {
            const { success, data } = await AccountRouter.list(new AccountListRequest({ page: 1 }));
            const { list } = data;
            setDemoList(list);
        })();
    }, []);

    return (
        <div className="max-w-screen">
            <Header name={Locale("Menu").Demo} />
            <div className="p-4">{JSON.stringify(DemoList)}</div>
        </div>
    );
};

export default DemoPage;
